import crypto from 'node:crypto'

export class Trip {
    constructor(
        public fecha_salida: string, //ISO YYYY-MM-DD
        public fecha_llegada: string, //ISO YYYY-MM-DD
        public estado: 'pendiente' | 'confirmado' | 'cancelado' | 'completado', 
        public usuario_id: number,
        public destino_id: number,
        public id?: number
    ) {} 
}