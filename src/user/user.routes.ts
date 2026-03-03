import { Router } from "express";
import { findAll, findOne, signup, update, remove, login, getProfile, logout, getUserStats, updateProfile } from "./user.controller.js";
import { sanitizeUserInput } from "../shared/middleware/sanitizeUsers.js";
import {sanitizeLoginInput} from "../shared/middleware/sanitizeLogin.js"
import { verifyToken } from "../shared/middleware/verifytoken.js";
import { verifyAdmin } from "../shared/middleware/verifyAdmin.js";

export const userRouter = Router()

//ruta de prueba
userRouter.get("/test", (req, res) => {
  res.json({ 
    message: "Server is working!", 
    timestamp: new Date().toISOString()
  });
});
// Rutas públicas
userRouter.post("/login", sanitizeLoginInput, login); // login de usuario
userRouter.post("/signup", sanitizeUserInput, signup); // registrar usuario
userRouter.post("/logout", logout); // logout de usuario

// Rutas del perfil del usuario autenticado (ANTES de /:id para evitar que Express capture "profile" como id)
userRouter.get("/profile/me", verifyToken, getProfile);
userRouter.get('/profile/stats', verifyToken, getUserStats);
userRouter.put('/profile/update', verifyToken, sanitizeUserInput, updateProfile);

// Rutas privadas
userRouter.get("/", verifyToken, findAll);
userRouter.get("/:id", verifyToken, findOne);

// Rutas de admin — solo administradores pueden modificar/eliminar usuarios por ID
userRouter.put("/:id", verifyToken, verifyAdmin, sanitizeUserInput, update);
userRouter.patch("/:id", verifyToken, verifyAdmin, sanitizeUserInput, update);
userRouter.delete("/:id", verifyToken, verifyAdmin, remove);


export default userRouter;