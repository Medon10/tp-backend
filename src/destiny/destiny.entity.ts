import { Entity, Property, OneToMany, Collection, Cascade } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Flight } from '../flight/flight.entity.js';

@Entity({ tableName: 'destinies' })
export class Destiny extends BaseEntity {

    @Property( { nullable: false, unique: false })
    nombre!: string;

    @Property({ type: 'json', nullable: true })
    transporte!: string[];

    @Property({ type: 'json', nullable: true })
    actividades?: string[];

    @OneToMany(() => Flight, flight => flight.destino, { cascade: [Cascade.PERSIST, Cascade.REMOVE] })
    flights = new Collection<Flight>(this);
}