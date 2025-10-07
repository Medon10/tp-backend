import { Entity, Property, OneToMany, Cascade, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Reservation } from '../reservation/reservation.entity.js';
import { Favorite } from '../favorite/favorite.entity.js';

@Entity({tableName: 'users'})
export class User extends BaseEntity {
    @Property({ nullable: false, unique: false })
    nombre!: string;

    @Property({ nullable: false, unique: false })
    apellido!: string;

    @Property({ nullable: false, unique: true })
    email!: string;

    @Property( { nullable: false, unique: false })
    password!: string;

    @Property( { nullable: true, unique: true })
    telefono!: string;

    @OneToMany(() => Reservation, reservation => reservation.usuario, {cascade: [Cascade.PERSIST, Cascade.REMOVE]})
    reservations = new Collection<Reservation>(this);

    @OneToMany(() => Favorite, favorite => favorite.user)
    favorites = new Collection<Favorite>(this);
}