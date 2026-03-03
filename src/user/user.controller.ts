import {Request, Response, NextFunction} from "express";
import { orm } from '../shared/bdd/orm.js';
import { User } from "./user.entity.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Reservation } from "../reservation/reservation.entity.js";

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
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function login(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const { email, password } = req.body.sanitizedInput;

    const user = await em.findOne(User, { email });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol }, 
      JWT_SECRET, 
      { expiresIn: "1h" }
    );

    // Configurar cookie con el token (ajustada para cross-site en producción)
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd, // requerido para SameSite=None
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 3600000, // 1 hora
    });
    const { password: _, ...userWithoutPassword } = user;
    
  res.status(200).json({ message: "Login exitoso", user: userWithoutPassword, token });
  } catch (error: any) {
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

async function logout(req: Request, res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  res.status(200).json({ message: "Logout exitoso" });
}

async function getUserStats(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const userId = (req as any).user.id;

    // Obtener usuario
    const user = await em.findOne(User, { id: userId });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Contar viajes completados
    const viajesCompletados = await em.count(Reservation, {
      usuario: userId, // usar la propiedad 'usuario' que existe en la entidad Reservation
      estado: 'completado' 
    });

    const proximosViajes = await em.count(Reservation, {
      usuario: userId,
      estado: 'confirmado'
    });

    // Obtener el ultimo próximo viaje (estado CONFIRMADO, ordenado por fecha de vuelo)
    const proximoViaje = await em.findOne(
      Reservation,
      {
        usuario: userId, // usar la propiedad 'usuario' que existe en la entidad Reservation
        estado: 'confirmado' 
      },
      {
        populate: ['flight', 'flight.destino'],
        orderBy: { createdAt: 'DESC' } 
      }
    );

    // Calcular años como miembro
    const fechaRegistro = user.createdAt;
    const ahora = new Date();

    let years = ahora.getFullYear() - fechaRegistro.getFullYear();
    let months = ahora.getMonth() - fechaRegistro.getMonth();
    let days = ahora.getDate() - fechaRegistro.getDate();

    if (days < 0) {
      const daysInPrevMonth = new Date(ahora.getFullYear(), ahora.getMonth(), 0).getDate();
      days += daysInPrevMonth;
      months -= 1;
    }

    if (months < 0) {
      months += 12;
      years -= 1;
    }

    // Texto legible
    let tiempoComoMiembro = '';
    if (years > 0) {
      tiempoComoMiembro = `${years} ${years === 1 ? 'año' : 'años'}`;
      if (months > 0) {
        tiempoComoMiembro += ` y ${months} ${months === 1 ? 'mes' : 'meses'}`;
      }
    } else if (months > 0) {
      tiempoComoMiembro = `${months} ${months === 1 ? 'mes' : 'meses'}`;
      if (days > 0) {
        tiempoComoMiembro += ` y ${days} ${days === 1 ? 'día' : 'días'}`;
      }
    } else {
      tiempoComoMiembro = `${days} ${days === 1 ? 'día' : 'días'}`;
    }

    const responseData = {
      viajesCompletados,
      proximosViajes,
      proximoViaje: proximoViaje ? {
        id: proximoViaje.id,
        destino: proximoViaje.flight?.destino?.nombre || 'Destino desconocido',
        fecha_vuelo: proximoViaje.flight?.fechahora_salida || new Date().toISOString(),
        precio_total: proximoViaje.valor_reserva || 0 
      } : null,
      miembroDesde: fechaRegistro.toISOString(),
      aniosComoMiembro: tiempoComoMiembro,
      // Para backward compatibility
      aniosNumerico: years || 0
    };

    res.status(200).json({
      message: 'Estadísticas del usuario',
      data: responseData
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Actualizar nombre y apellido
async function updateProfile(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const userId = (req as any).user.id;
    const { nombre, apellido } = req.body.sanitizedInput;

    const user = await em.findOne(User, { id: userId });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Solo actualizar nombre y apellido
    if (nombre) user.nombre = nombre;
    if (apellido) user.apellido = apellido;
    user.updatedAt = new Date();

    await em.flush();

    res.status(200).json({
      message: 'Perfil actualizado correctamente',
      data: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email
      }
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { findAll, findOne, add, update, remove, login, getProfile, signup, logout, getUserStats, updateProfile };