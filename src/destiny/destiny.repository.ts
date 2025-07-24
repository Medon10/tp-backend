import { Destiny } from "./destiny.entity.js";
import { Repository } from "../shared/repository.js";
import { pool } from '../shared/bdd/mysql.bdd.js'
import { RowDataPacket } from "mysql2";



export class DestinyRepository implements Repository<Destiny>{

    public async findAll(): Promise<Destiny [] | undefined>{
        const [destinies] = await pool.query('select * from destinies')
        return destinies as Destiny[]
    }

    public async findOne(item:{id: string;}): Promise<Destiny | undefined>{
        const id = Number.parseInt(item.id)
        const [destinies] = await pool.query<RowDataPacket[]>('select * from destinies where id = ?', [id])
        if(destinies.length === 0) {
            return undefined
        }
        const destiny = destinies[0] as Destiny
        return destiny
    }

    public async add(item: Destiny): Promise<Destiny | undefined>{
        throw new Error('no implementado')
    }

    public async update(item: Destiny): Promise<Destiny | undefined>{
        throw new Error('no implementado')
    }

    public async delete(item: {id: string;}): Promise<Destiny | undefined>{
        throw new Error('no implementado')
    }
}