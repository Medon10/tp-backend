import { Request, Response, NextFunction } from "express";

export function sanitizeLoginInput(req: Request, res: Response, next: NextFunction) {
    // Para debugging - simplificar al máximo
    console.log("=== SANITIZE LOGIN MIDDLEWARE ===");
    console.log("Method:", req.method);
    console.log("Body:", req.body);
    
    // Si es OPTIONS, pasar directo
    if (req.method === 'OPTIONS') {
        return next();
    }
    
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email y contraseña son requeridos"
        });
    }
    
    req.body.sanitizedInput = {
        email: email.trim().toLowerCase(),
        password: password
    };
    
    next();
}