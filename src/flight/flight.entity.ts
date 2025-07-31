import crypto from 'node:crypto'

export class Flight {
    constructor(
        public fechahora_salida:string, //ISO YYYY-MM-DD HH:mm
        public fechahora_llegada:string, //ISO YYYY-MM-DD HH:mm
        public duracion:number, 
        public aerolinea:string,
        public cantidad_asientos:number, 
        public id?: number
    ) {}
}