import { Flight } from './flight.entity.js'
import { Repository } from '../shared/repository.js'
import { pool } from '../shared/bdd/mysql.bdd.js'



export class FlightRepository implements Repository<Flight>{
    public async findAll(): Promise<Flight [] | undefined>{
        const [Flights] = await pool.query('select * from Flights')
        return Flights as Flight[]
    }

    public async findOne(item:{id: string;}): Promise<Flight | undefined>{
        throw new Error('no implementado')
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

