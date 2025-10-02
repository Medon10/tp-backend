import { Router } from "express";
import { findAll, findOne, add, update, remove, uploadImage } from "./destiny.controller.js";
import { sanitizeDestinyInput } from "../shared/middleware/sanitizeDestiny.js";
import { uploadDestinyImage } from "../shared/middleware/uploadImage.js";

export const destinyRouter = Router()

destinyRouter.get('/', findAll)
destinyRouter.get('/:id', findOne)
destinyRouter.post('/', sanitizeDestinyInput, add)
destinyRouter.post('/:id/upload', uploadDestinyImage.single('imagen'), uploadImage);
destinyRouter.put('/:id', sanitizeDestinyInput, update)
destinyRouter.patch('/:id', sanitizeDestinyInput, update)
destinyRouter.delete('/:id', remove)