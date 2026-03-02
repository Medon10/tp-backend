import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { verifyAdmin } from './verifyAdmin'; // Ajusta la importación según cómo lo exportes

describe('verifyAdmin Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    // Reiniciamos los mocks antes de cada test para evitar contaminación
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(), // Permite encadenar res.status().json()
      json: vi.fn(),
    };
    nextFunction = vi.fn();
  });

  it('debería retornar 401 cuando req.user no existe', () => {
    // Al no definir mockRequest.user, simulamos que no hay usuario
    verifyAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('debería retornar 403 cuando el rol del usuario no es "admin"', () => {
    mockRequest = {
      // Simulamos un usuario logueado pero con un rol distinto
      user: { rol: 'cliente' } 
    } as any; // Usamos as any o extendemos la interfaz Request si tienes un type custom

    verifyAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('debería llamar a next() cuando el rol es "admin"', () => {
    mockRequest = {
      user: { rol: 'admin' }
    } as any;

    verifyAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
});