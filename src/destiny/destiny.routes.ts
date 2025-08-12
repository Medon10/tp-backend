import { Router } from "express";
import { findAll, findOne, add, update, remove } from "./destiny.controller.js";
import { sanitizeDestinyInput } from "../shared/middleware/sanitizeDestiny.js";

export const destinyRouter = Router()

destinyRouter.get('/', findAll)
destinyRouter.get('/:id', findOne)
destinyRouter.post('/', sanitizeDestinyInput, add)
destinyRouter.put('/:id', sanitizeDestinyInput, update)
destinyRouter.patch('/:id', sanitizeDestinyInput, update)
destinyRouter.delete('/:id', remove)