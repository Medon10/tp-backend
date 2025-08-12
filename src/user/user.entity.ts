import { Entity, Property, OneToMany, Cascade } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Trip } from '../trip/trip.entity.js';

@Entity({tableName: 'users'})
export class User extends BaseEntity {
    @Property({ nullable: false, unique: false })
    nombre!: string;

    @Property({ nullable: false, unique: false })
    apellido!: string;

    @Property({ nullable: false, unique: true })
    email!: string;

    @Property( { nullable: false, unique: false })
    contraseña!: string;

    @Property( { nullable: true, unique: true })
    telefono!: string;

    @OneToMany(() => Trip, trip => trip.usuario, {cascade: [Cascade.PERSIST, Cascade.REMOVE]})
    trips = new Array<Trip>();
}