import crypto from 'node:crypto'

export class Flight {
    constructor(
        public CiudadSalida:string, 
        public CiudadLlegada:string, 
        public duracion:number, 
        public tipo:string, 
        public id?: number
    ) {}
}