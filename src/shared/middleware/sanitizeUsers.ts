import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

export async function sanitizeUserInput(req: Request, res: Response, next: NextFunction) {
    console.log("=== SANITIZE MIDDLEWARE ===");
    console.log("URL:", req.url);
    console.log("Body recibido:", req.body);
    
    const saltRounds = 10;
    const isLoginRoute = req.route?.path === '/login' || req.url.includes('/login');
    
    // Validaciones básicas
    if (!req.body.email) {
        return res.status(400).json({ message: "Email es requerido" });
    }
    
    if (!req.body.password) {
        return res.status(400).json({ message: "Contraseña es requerida" });
    }
    
    // Validar email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: "Formato de email inválido" });
    }
    
    // Hashear contraseña solo para registro
    let processedPassword = req.body.password;
    if (!isLoginRoute) {
        processedPassword = await bcrypt.hash(req.body.password, saltRounds);
        console.log("Password hasheada para registro");
    }
    
    req.body.sanitizedInput = {
        nombre: req.body.nombre?.trim(),
        apellido: req.body.apellido?.trim(),
        password: processedPassword,
        email: req.body.email.trim().toLowerCase(),
        telefono: req.body.telefono?.trim(),
    };
    
    // Limpiar campos undefined
    Object.keys(req.body.sanitizedInput).forEach((key) => {
        if (req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key];
        }
    });
    
    console.log("Sanitized input:", { ...req.body.sanitizedInput, password: '[HIDDEN]' });
    next();
}