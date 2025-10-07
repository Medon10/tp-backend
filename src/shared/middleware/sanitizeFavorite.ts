import { Request, Response, NextFunction } from "express";

export function sanitizeFavoriteInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    flight_id: Number(req.body.flight_id)
  };
  next();
}