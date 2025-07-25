import { User } from "./user.entity.js";
import { Repository } from "../shared/repository.js";
import { pool } from '../shared/bdd/mysql.bdd.js'
import { RowDataPacket } from "mysql2";



export class UserRepository implements Repository<User>{
    
    public async findAll(): Promise<User [] | undefined>{
        const [users] = await pool.query('select * from users')
        return users as User[]
    }

    public async findOne(item:{id: string;}): Promise<User | undefined>{
        const id = Number.parseInt(item.id)
        const [users] = await pool.query<RowDataPacket[]>('select * from users where id = ?', [id])
        if(users.length === 0) {
            return undefined
        }
        const user = users[0] as User
        return user
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