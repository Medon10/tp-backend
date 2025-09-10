import { Router } from "express";
import { findAll, findOne, add, update, remove, login, getProfile } from "./user.controller.js";
import { sanitizeUserInput } from "../shared/middleware/sanitizeUsers.js";
import { verifyToken } from "../shared/middleware/verifytoken.js";

export const userRouter = Router()

// Rutas públicas
userRouter.post("/login", login); // login de usuario
userRouter.post("/", sanitizeUserInput, add); // registrar usuario

// Rutas privadas
userRouter.get("/", verifyToken, findAll);
userRouter.get("/:id", verifyToken, findOne);
userRouter.get("/profile/me", verifyToken, getProfile); // devuelve el perfil del usuario autenticado

userRouter.put("/:id", verifyToken, sanitizeUserInput, update);
userRouter.patch("/:id", verifyToken, sanitizeUserInput, update);
userRouter.delete("/:id", verifyToken, remove);

export default userRouter;