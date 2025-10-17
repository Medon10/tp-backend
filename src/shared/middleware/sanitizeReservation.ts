import {Request, Response, NextFunction } from "express";

export async function sanitizeReservationInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        flight_id: req.body.flight_id,
        cantidad_personas: req.body.cantidad_personas,
    }

    Object.keys(req.body.sanitizedInput).forEach((key)=>{
        if(req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key]
        }   
    })
    next()
}