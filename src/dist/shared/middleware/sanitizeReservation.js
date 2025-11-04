export async function sanitizeReservationInput(req, res, next) {
    req.body.sanitizedInput = {
        flight_id: req.body.flight_id,
        cantidad_personas: req.body.cantidad_personas,
    };
    Object.keys(req.body.sanitizedInput).forEach((key) => {
        if (req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key];
        }
    });
    next();
}
//# sourceMappingURL=sanitizeReservation.js.map