export async function sanitizeDestinyInput(req, res, next) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        transporte: req.body.transporte,
        actividades: req.body.actividades
    };
    Object.keys(req.body.sanitizedInput).forEach((key) => {
        if (req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key];
        }
    });
    next();
}
//# sourceMappingURL=sanitizeDestiny.js.map