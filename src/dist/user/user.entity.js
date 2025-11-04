var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, Property, OneToMany, Cascade, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Reservation } from '../reservation/reservation.entity.js';
import { Favorite } from '../favorite/favorite.entity.js';
let User = class User extends BaseEntity {
    constructor() {
        super(...arguments);
        this.reservations = new Collection(this);
        this.favorites = new Collection(this);
    }
};
__decorate([
    Property({ nullable: false, unique: false }),
    __metadata("design:type", String)
], User.prototype, "nombre", void 0);
__decorate([
    Property({ nullable: false, unique: false }),
    __metadata("design:type", String)
], User.prototype, "apellido", void 0);
__decorate([
    Property({ nullable: false, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Property({ nullable: false, hidden: true }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    Property({ default: 'cliente' }),
    __metadata("design:type", String)
], User.prototype, "rol", void 0);
__decorate([
    Property({ nullable: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "telefono", void 0);
__decorate([
    OneToMany(() => Reservation, reservation => reservation.usuario, { cascade: [Cascade.PERSIST, Cascade.REMOVE] }),
    __metadata("design:type", Object)
], User.prototype, "reservations", void 0);
__decorate([
    OneToMany(() => Favorite, favorite => favorite.user),
    __metadata("design:type", Object)
], User.prototype, "favorites", void 0);
User = __decorate([
    Entity({ tableName: 'users' })
], User);
export { User };
//# sourceMappingURL=user.entity.js.map