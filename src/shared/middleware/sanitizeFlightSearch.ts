import { Request, Response, NextFunction } from "express";

export function sanitizeFlightSearch(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    presupuesto: Number(req.body.presupuesto),
    personas: Number(req.body.personas),
    origen: req.body.origen?.trim(),
    fecha_salida: req.body.fecha_salida || null
  };
  
  console.log(' Sanitized search input:', req.body.sanitizedInput);
  
  next();
}