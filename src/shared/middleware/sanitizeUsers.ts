import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

export async function sanitizeUserInput(req: Request, res: Response, next: NextFunction) {
    const saltRounds = 10;
    let hashedPassword = undefined;
    if (req.body.contraseña) {
        hashedPassword = await bcrypt.hash(req.body.contraseña, saltRounds);
    }
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        contraseña: hashedPassword,
        email: req.body.email,
        telefono: req.body.telefono,
        ...(hashedPassword && { contraseña: hashedPassword })
    };
    
    Object.keys(req.body.sanitizedInput).forEach((key) => {
        if (req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key]
        }
    })
    next()
}