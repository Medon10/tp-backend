import {Request, Response, NextFunction} from "express";
import { orm } from '../shared/bdd/orm.js';
import { User } from "./user.entity.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.TOKEN_SECRET || "secret123"

async function findAll (req:Request, res:Response) {
    try {
        const em = orm.em.fork();
        const users = await em.find(User, {})
        res.status(200).json({message: 'Usuarios encontrados', data: users})
    } catch (error: any) {
        res.status(500).json({message: 'Error al obtener usuarios', error})
    }
}

async function findOne(req: Request, res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number(req.params.id)
        const user = await em.findOne(User, { id })
        res.status(200).json({message: 'Usuario encontrado', data: user})
    } catch (error: any) {
        res.status(500).json({message: 'Error al obtener usuario', error})
    }
}

async function signup(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const { email, password, nombre, apellido } = req.body.sanitizedInput;

    // Verificar si el usuario ya existe
    const existing = await em.findOne(User, { email });
    if (existing) {
      return res.status(409).json({ message: "Este email ya está registrado" });
    }

    // Crear usuario (la contraseña ya viene hasheada del middleware)
    const user = em.create(User, req.body.sanitizedInput);
    await em.flush();

    // Devolver usuario sin la contraseña
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({ 
      message: "Usuario registrado exitosamente", 
      user: userWithoutPassword 
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function login(req: Request, res: Response) {
  console.log("=== LOGIN CONTROLLER ===");
  console.log("Body:", req.body);
  console.log("Sanitized input:", req.body.sanitizedInput);

  try {
    const em = orm.em.fork();
    const { email, password } = req.body.sanitizedInput;

    const user = await em.findOne(User, { email });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

    // Configurar cookie con el token
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // true solo en HTTPS
      sameSite: 'lax',
      maxAge: 3600000 // 1 hora en milisegundos
    });
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({ message: "Login exitoso", user: userWithoutPassword });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
  
}

async function getProfile(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const userId = (req as any).user.id; // el middleware mete el user en req
    const user = await em.findOne(User, { id: userId });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    res.status(200).json({ message: "Usuario autenticado", data: user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function add(req:Request, res: Response) {
    try{
        const em = orm.em.fork();
        const user = em.create(User, req.body.sanitizedInput)
        await em.flush()
        res.status(201).json({message: 'Usuario creado', data: user})
    }
    catch(error: any){
        res.status(500).json({message: error.message})
    }
}

async function update(req:Request, res: Response) {
    try{
        const em = orm.em.fork();
        const id = Number.parseInt(req.params.id)
        const user = await em.findOneOrFail(User, id)
        em.assign(user, req.body.sanitizedInput)
        await em.flush()
        res.status(200).json({message: 'Usuario actualizado', data: user})
    }
    catch(error: any){
        res.status(500).json({message: error.message})
    }
}

async function remove(req:Request, res: Response) {
    try{
        const em = orm.em.fork();   
        const id = Number.parseInt(req.params.id)
        const user = await em.findOneOrFail(User, id)
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        await em.removeAndFlush(user)
        res.status(200).json({message: 'Usuario borrado'})
    }
    catch(error: any){
        res.status(500).json({message: error.message})    
    }
}

export { findAll, findOne, add, update, remove, login, getProfile, signup }