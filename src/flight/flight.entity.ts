import crypto from 'node:crypto'

export class Flight {
    constructor(
        public fechahora_salida:string, 
        public fechahora_llegada:string, 
        public duracion:number, 
        public aerolinea:string,
        public cantidad_asientos:number, 
        public id?: number
    ) {}
}