import crypto from 'node:crypto'

export class Destiny {
    constructor(
        public nombre:string, 
        public transporte:string[],
        public actividades?:string[],  
        public id?: number
    ) {} 
}