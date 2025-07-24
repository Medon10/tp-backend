import { Flight } from './flight.entity.js'
import { Repository } from '../shared/repository.js'
import { pool } from '../shared/bdd/mysql.bdd.js'
import { RowDataPacket } from 'mysql2'



export class FlightRepository implements Repository<Flight>{
    public async findAll(): Promise<Flight [] | undefined>{
        const [Flights] = await pool.query('select * from Flights')
        return Flights as Flight[]
    }

    public async findOne(item:{id: string;}): Promise<Flight | undefined>{
        const id = Number.parseInt(item.id)
        const [Flights] = await pool.query<RowDataPacket[]>('select * from Flights where id = ?', [id])
        if(Flights.length === 0) {
            return undefined
        }
        const flight = Flights[0] as Flight
        return flight
    }

    public add(item: Flight): Promise<Flight | undefined>{
        throw new Error('no implementado')
    }

    public update(item: Flight): Promise <Flight | undefined>{
        throw new Error('no implementado')
    }

    public delete(item: {id: string;}): Promise<Flight | undefined>{
        throw new Error('no implementado')
    }
}

