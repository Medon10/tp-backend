import { Router } from "express";
import { findAll, findOne, add, update, remove, uploadImage } from "./destiny.controller.js";
import { sanitizeDestinyInput } from "../shared/middleware/sanitizeDestiny.js";
import { uploadDestinyImage } from "../shared/middleware/uploadImage.js";
import { verifyToken } from "../shared/middleware/verifytoken.js";
import { verifyAdmin } from "../shared/middleware/verifyAdmin.js";
export const destinyRouter = Router();
destinyRouter.get('/', findAll);
destinyRouter.get('/:id', findOne);
destinyRouter.post('/', verifyToken, verifyAdmin, sanitizeDestinyInput, add);
destinyRouter.post('/:id/upload', verifyToken, verifyAdmin, uploadDestinyImage.single('imagen'), uploadImage);
destinyRouter.put('/:id', verifyToken, verifyAdmin, sanitizeDestinyInput, update);
destinyRouter.patch('/:id', verifyToken, verifyAdmin, sanitizeDestinyInput, update);
destinyRouter.delete('/:id', verifyToken, verifyAdmin, remove);
//# sourceMappingURL=destiny.routes.js.map