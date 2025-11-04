export function sanitizeFlightSearch(req, res, next) {
    req.body.sanitizedInput = {
        presupuesto: Number(req.body.presupuesto),
        personas: Number(req.body.personas),
        origen: req.body.origen?.trim(),
        fecha_salida: req.body.fecha_salida || null
    };
    console.log(' Sanitized search input:', req.body.sanitizedInput);
    next();
}
//# sourceMappingURL=sanitizeFlightSearch.js.map