import {Request, Response, NextFunction } from "express";

export async function sanitizeReservationInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        fecha_reserva: req.body.fecha_reserva,
        valor_reserva: req.body.valor_reserva,
        estado: req.body.estado,
        usuario_id: req.body.usuario_id,
        flight_id: req.body.flight_id

    }

    Object.keys(req.body.sanitizedInput).forEach((key)=>{
        if(req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key]
        }   
    })
    next()
}