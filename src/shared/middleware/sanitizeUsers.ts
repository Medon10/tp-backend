import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

export async function sanitizeUserInput(req: Request, res: Response, next: NextFunction) {
    console.log("=== SANITIZE MIDDLEWARE ===");
    console.log("URL:", req.url);
    console.log("Route path:", req.route?.path);
    console.log("Body recibido:", req.body);
    
    const saltRounds = 10;
    let hashedPassword = undefined;
    const isLoginRoute = req.route?.path === '/login' || req.url.includes('/login');
    
    console.log("Is login route?", isLoginRoute);
    
    if (req.body.password && !isLoginRoute) {
        hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        console.log("Password hashed for non-login route");
    } else {
        console.log("Password NOT hashed (login route or no password)");
    }
    
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        password: isLoginRoute ? req.body.password : hashedPassword,
        email: req.body.email,
        telefono: req.body.telefono,
    };
    
    console.log("Sanitized input:", req.body.sanitizedInput);
    
    Object.keys(req.body.sanitizedInput).forEach((key) => {
        if (req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key]
        }
    })
    
    next()
}