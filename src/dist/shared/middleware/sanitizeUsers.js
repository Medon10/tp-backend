import bcrypt from "bcryptjs";
export async function sanitizeUserInput(req, res, next) {
    console.log("=== SANITIZE MIDDLEWARE ===");
    console.log("URL:", req.url);
    console.log("Body recibido:", req.body);
    const saltRounds = 10;
    const isLoginRoute = req.route?.path === '/login' || req.url.includes('/login');
    const isUpdateRoute = req.route?.path === '/profile/update' || req.url.includes('/profile/update');
    // Si es actualización de perfil, solo validar nombre y apellido
    if (isUpdateRoute) {
        if (!req.body.nombre?.trim() && !req.body.apellido?.trim()) {
            return res.status(400).json({
                message: "Debes proporcionar al menos el nombre o apellido para actualizar"
            });
        }
        req.body.sanitizedInput = {
            nombre: req.body.nombre?.trim(),
            apellido: req.body.apellido?.trim()
        };
        // Limpiar campos undefined
        Object.keys(req.body.sanitizedInput).forEach((key) => {
            if (req.body.sanitizedInput[key] === undefined) {
                delete req.body.sanitizedInput[key];
            }
        });
        console.log("Sanitized input (update):", req.body.sanitizedInput);
        return next();
    }
    // Para login y registro: validaciones de email y password
    if (!req.body.email) {
        return res.status(400).json({ message: "Email es requerido" });
    }
    if (!req.body.password) {
        return res.status(400).json({ message: "Contraseña es requerida" });
    }
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: "Formato de email inválido" });
    }
    // Validar longitud de contraseña para registro
    if (!isLoginRoute && req.body.password.length < 6) {
        return res.status(400).json({
            message: "La contraseña debe tener al menos 6 caracteres"
        });
    }
    // Hashear contraseña solo para registro
    let processedPassword = req.body.password;
    if (!isLoginRoute) {
        processedPassword = await bcrypt.hash(req.body.password, saltRounds);
        console.log(" Password hasheada para registro");
    }
    else {
        console.log("Login: password sin hashear");
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
    console.log("Sanitized input:", {
        ...req.body.sanitizedInput,
        password: '[HIDDEN]'
    });
    next();
}
//# sourceMappingURL=sanitizeUsers.js.map