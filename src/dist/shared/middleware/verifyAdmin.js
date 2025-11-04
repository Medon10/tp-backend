// Este middleware se usa DESPUÉS de verifyToken
export function verifyAdmin(req, res, next) {
    // Asumimos que verifyToken ya añadió el usuario a req
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'No autenticado' });
    }
    if (user.rol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    // Si es admin, permite continuar
    next();
}
//# sourceMappingURL=verifyAdmin.js.map