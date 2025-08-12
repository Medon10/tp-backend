import { Entity, Property, ManyToOne, Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { User } from '../user/user.entity.js';
import { Destiny } from '../destiny/destiny.entity.js'; 
import type { Flight } from '../flight/flight.entity.js';

@Entity({ tableName: 'trips' })
export class Trip extends BaseEntity {

    @Property()
    fecha_reserva!: string; // ISO YYYY-MM-DD

    @Property()
    valor_reserva!: number;

    @Property()
    estado!: 'pendiente' | 'confirmado' | 'cancelado' | 'completado';

    @ManyToOne(() => User)
    usuario!: User;

    @ManyToOne(() => Destiny) //puede ser redundante pero es util para consultar rapido donde fue el destino del viaje del usuario
    destino!: Destiny; 

    @ManyToOne('Flight')
    flight!: Rel<Flight>; // Relación con el vuelo, puede ser un objeto Flight o un ID de vuelo
}