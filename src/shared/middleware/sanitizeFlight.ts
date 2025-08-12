import { Request, Response, NextFunction } from "express"

export async function sanitizeFlightInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        fechahora_salida: req.body.fechahora_salida,
        fechahora_llegada: req.body.fechahora_llegada,
        duracion: req.body.duracion,
        aerolinea: req.body.aerolinea,
        cantidad_asientos: req.body.cantidad_asientos,
        montoVuelo: req.body.montoVuelo,
        origen: req.body.origen,
        destino_id: req.body.destino_id
    }

    Object.keys(req.body.sanitizedInput).forEach((key)=>{
        if(req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key]
        }   
    })
    next()
}