import { User } from "./user.entity.js";
import { Repository } from "../shared/repository.js";
import { pool } from '../shared/bdd/mysql.bdd.js'



export class UserRepository implements Repository<User>{
    public async findAll(): Promise<User [] | undefined>{
        const [users] = await pool.query('select * from users')
        return users as User[]
    }

    public async findOne(item:{id: string;}): Promise<User | undefined>{
        throw new Error('no implementado')
    }

    public async add(item: User): Promise<User | undefined>{
        throw new Error('no implementado')
    }

    public async update(item: User): Promise<User | undefined>{
        throw new Error('no implementado')
    }

    public async delete(item: {id: string;}): Promise<User | undefined>{
        throw new Error('no implementado')
    }
}