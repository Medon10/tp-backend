import { Router } from "express";
import { sanitizeUserInput, findAll, findOne, add, update, remove } from "./destiny.controller.js";

export const destinyRouter = Router()

destinyRouter.get('/', findAll)
destinyRouter.get('/:id', findOne)
destinyRouter.post('/', sanitizeUserInput, add)
destinyRouter.put('/:id', sanitizeUserInput, update)
destinyRouter.patch('/:id', sanitizeUserInput, update)
destinyRouter.delete('/:id', remove)