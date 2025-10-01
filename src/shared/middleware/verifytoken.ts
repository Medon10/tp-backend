import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../types/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}



export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies.token;
  const TOKEN_SECRET = process.env.TOKEN_SECRET;

  if (!token) {
    res.status(401).json({ message: 'token no proporcionado' });
    return;
}

  if (!TOKEN_SECRET) {
    throw new Error("TOKEN_SECRET is not defined in env");
  }

  try {

    const decoded = jwt.verify(token, TOKEN_SECRET) as User;
    req.user = decoded;
    next();

  } catch (error: any) {
    res.status(403).json({ message: 'token inválido', error: error.message });
    return;
  }
}