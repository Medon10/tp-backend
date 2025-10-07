import { Router } from "express";
import { findUserFavorites, addFavorite, removeFavorite, checkFavorite } from "./favorite.controller.js";
import { sanitizeFavoriteInput } from "../shared/middleware/sanitizeFavorite.js";
import { verifyToken } from "../shared/middleware/verifytoken.js"; // Tu middleware de auth

export const favoriteRouter = Router();

// Todas las rutas requieren autenticación
favoriteRouter.use(verifyToken);

favoriteRouter.get('/', findUserFavorites);
favoriteRouter.post('/', sanitizeFavoriteInput, addFavorite);
favoriteRouter.delete('/:flightId', removeFavorite);
favoriteRouter.get('/check/:flightId', checkFavorite);