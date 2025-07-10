import crypto from 'node:crypto'

export class User {
    constructor(
        public nombre:string, 
        public apellido:string, 
        public email:string, 
        public contraseña:string, 
        public telefono:number,
        public id?: number
    ) {}
}