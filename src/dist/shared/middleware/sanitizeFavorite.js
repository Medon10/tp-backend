export function sanitizeFavoriteInput(req, res, next) {
    req.body.sanitizedInput = {
        flight_id: Number(req.body.flight_id)
    };
    next();
}
//# sourceMappingURL=sanitizeFavorite.js.map