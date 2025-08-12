import { Entity, Property, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Destiny } from '../destiny/destiny.entity.js';
import { Trip } from '../trip/trip.entity.js';

@Entity({ tableName: 'flights' })
export class Flight extends BaseEntity {
    @Property()
    fechahora_salida!: string; // ISO

    @Property()
    fechahora_llegada!: string;

    @Property()
    duracion!: number;

    @Property()
    aerolinea!: string;

    @Property()
    cantidad_asientos!: number;
    
    @Property({ fieldName: 'montoVuelo'})
    montoVuelo!: number;

    @Property()
    origen!: string;

    @ManyToOne(() => Destiny)
    destino!: Destiny;

    @OneToMany(() => Trip, trip => trip.flight)
    trips = new Collection<Trip>(this);
}