import { Trip } from "./trip.entity.js";
import { Repository } from "../shared/repository.js";
import { pool } from '../shared/bdd/mysql.bdd.js'
import { RowDataPacket } from "mysql2";



export class TripRepository implements Repository<Trip>{
    
    public async findAll(): Promise<Trip [] | undefined>{
        const [trips] = await pool.query('select * from trips')
        return trips as Trip[]
    }

    public async findOne(item:{id: string;}): Promise<Trip | undefined>{
        const id = Number.parseInt(item.id)
        const [trips] = await pool.query<RowDataPacket[]>('select * from trips where id = ?', [id])
        if(trips.length === 0) {
            return undefined
        }
        const trip = trips[0] as Trip
        return trip
    }

    public async add(item: Trip): Promise<Trip | undefined>{
        throw new Error('no implementado')
    }

    public async update(item: Trip): Promise<Trip | undefined>{
        throw new Error('no implementado')
    }

    public async delete(item: {id: string;}): Promise<Trip | undefined>{
        throw new Error('no implementado')
    }
}