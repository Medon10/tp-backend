import jwt from 'jsonwebtoken';
const TOKEN_SECRET = process.env.TOKEN_SECRET;
export function verifyToken(req, res, next) {
    const token = req.cookies.token;
    const TOKEN_SECRET = process.env.TOKEN_SECRET;
    if (!token) {
        res.status(401).json({ message: 'token no proporcionado' });
        return;
    }
    if (!TOKEN_SECRET) {
        throw new Error("TOKEN_SECRET is not defined in env");
    }
    try {
        const decoded = jwt.verify(token, TOKEN_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(403).json({ message: 'token inválido', error: error.message });
        return;
    }
}
//# sourceMappingURL=verifytoken.js.map