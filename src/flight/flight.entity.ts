import { Entity, Property, ManyToOne, OneToMany, Collection, Cascade } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Destiny } from '../destiny/destiny.entity.js';
import { Reservation } from '../reservation/reservation.entity.js';
import { Favorite } from '../favorite/favorite.entity.js';

@Entity({ tableName: 'flights' })
export class Flight extends BaseEntity {
    @Property()
    fechahora_salida!: Date; // ISO

    @Property()
    fechahora_llegada!: Date;

    @Property()
    duracion!: number;

    @Property()
    aerolinea!: string;

    @Property({ nullable: false })
    cantidad_asientos!: number;

    @Property({ nullable: false })
    capacidad_restante!: number;
    
    @Property({ fieldName: 'montoVuelo'})
    montoVuelo!: number;

    @Property()
    origen!: string;

    @Property({ nullable: true })
    distancia_km?: number;

    @ManyToOne(() => Destiny)
    destino!: Destiny;

    @OneToMany(() => Reservation, reservation => reservation.flight, { cascade: [Cascade.REMOVE] })
    reservations = new Collection<Reservation>(this);

    @OneToMany(() => Favorite, favorite => favorite.flight, { cascade: [Cascade.REMOVE] })
    favorites = new Collection<Favorite>(this);
}