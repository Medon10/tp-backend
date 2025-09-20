import { Router } from "express";
import { findAll, findOne, signup, update, remove, login, getProfile } from "./user.controller.js";
import { sanitizeUserInput } from "../shared/middleware/sanitizeUsers.js";
import {sanitizeLoginInput} from "../shared/middleware/sanitizeLogin.js"
import { verifyToken } from "../shared/middleware/verifytoken.js";

export const userRouter = Router()

// Manejar explícitamente las requests OPTIONS para /login
userRouter.options('/login', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});
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

// Rutas privadas
userRouter.get("/", verifyToken, findAll);
userRouter.get("/:id", verifyToken, findOne);
userRouter.get("/profile/me", verifyToken, getProfile); // devuelve el perfil del usuario autenticado

userRouter.put("/:id", verifyToken, sanitizeUserInput, update);
userRouter.patch("/:id", verifyToken, sanitizeUserInput, update);
userRouter.delete("/:id", verifyToken, remove);


export default userRouter;