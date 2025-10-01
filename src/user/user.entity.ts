import { Entity, Property, OneToMany, Cascade } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Reservation } from '../reservation/reservation.entity.js';

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
    reservations = new Array<Reservation>();
}