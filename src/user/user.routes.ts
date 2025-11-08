import { Router } from "express";
import { findAll, findOne, signup, update, remove, login, getProfile, logout, getUserStats, updateProfile } from "./user.controller.js";
import { sanitizeUserInput } from "../shared/middleware/sanitizeUsers.js";
import {sanitizeLoginInput} from "../shared/middleware/sanitizeLogin.js"
import { verifyToken } from "../shared/middleware/verifytoken.js";

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

// Rutas privadas
userRouter.get("/", verifyToken, findAll);
userRouter.get("/:id", verifyToken, findOne);
userRouter.get("/profile/me", verifyToken, getProfile); // devuelve el perfil del usuario autenticado
userRouter.get('/profile/stats', verifyToken, getUserStats);
userRouter.put('/profile/update', verifyToken, sanitizeUserInput, updateProfile);

userRouter.put("/:id", verifyToken, sanitizeUserInput, update);
userRouter.patch("/:id", verifyToken, sanitizeUserInput, update);
userRouter.delete("/:id", verifyToken, remove);


export default userRouter;