import {Request, Response, NextFunction} from "express"
import { orm } from "../shared/bdd/orm.js"
import { Destiny } from "./destiny.entity.js"
import { uploadDestinyImage } from '../shared/middleware/uploadImage.js';

async function findAll (req:Request, res:Response) {
    try {
        const em = orm.em.fork();
        const destiny = await em.find(Destiny, {})
        res.json({data:destiny})
    } catch (error) {
        res.status(500).json({message: 'Error al obtener destinos', error})
    }
}

async function findOne(req: Request, res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number.parseInt(req.params.id)
        const destiny = await em.findOne(Destiny, { id })
        if (!destiny){
            return res.status(404).send({message:'No encontrado'})
        }
        res.status(200).json({message: 'Destino encontrado', data: destiny})
    } catch (error) {
        res.status(500).json({message: 'Error al obtener destino', error})
    }
}

async function add(req: Request, res: Response)  {
    try {
        const em = orm.em.fork();
        const destiny = em.create(Destiny, req.body.sanitizedInput)
        await em.flush()
        res.status(201).send({message: 'destino creado', data: destiny})
    } catch (error) {
        res.status(500).send({message: 'Error al crear destino', error})
    }
}

async function update(req: Request,res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number.parseInt(req.params.id)
        const destiny = await em.findOne(Destiny, { id })
        if(!destiny){
            return res.status(404).send({message: 'destino no encontrado'})
        }
        em.assign(destiny, req.body.sanitizedInput)
        await em.flush()
        res.status(200).send({message: 'destino actualizado', data: destiny})
    } catch (error) {
        res.status(500).send({message: 'Error al actualizar destino', error})
    }
}

async function remove(req: Request, res: Response){
    try {
        const em = orm.em.fork();
        const id = Number.parseInt(req.params.id)
        const destiny = await em.findOne(Destiny, { id })
        if(!destiny){
            return res.status(404).send({message: 'destino no encontrado'})
        }
        await em.removeAndFlush(destiny)
        res.status(200).send({message: 'destino borrado', data: destiny})
    } catch (error) {
        res.status(500).send({message: 'Error al borrar destino', error})
    }
}

async function uploadImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ninguna imagen' });
    }

    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const destiny = await em.findOne(Destiny, { id });

    if (!destiny) {
      return res.status(404).json({ message: 'Destino no encontrado' });
    }

    // Guardar la URL relativa
    destiny.imagen = `/uploads/destinos/${req.file.filename}`;
    await em.flush();

    res.status(200).json({ 
      message: 'Imagen actualizada', 
      data: destiny 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { findAll, findOne, add, update, remove, uploadImage }