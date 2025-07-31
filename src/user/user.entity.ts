import crypto from 'node:crypto'
import { Trip } from '../trip/trip.entity.js';

export class User {
    constructor(
        public nombre:string, 
        public apellido:string, 
        public email:string, 
        public contraseña:string, 
        public telefono:number,
        public id?: number,
        public trips?: Trip[],
    ) {} 
}