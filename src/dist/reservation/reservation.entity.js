var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { User } from '../user/user.entity.js';
let Reservation = class Reservation extends BaseEntity {
};
__decorate([
    Property(),
    __metadata("design:type", String)
], Reservation.prototype, "fecha_reserva", void 0);
__decorate([
    Property(),
    __metadata("design:type", Number)
], Reservation.prototype, "valor_reserva", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Reservation.prototype, "estado", void 0);
__decorate([
    Property({ nullable: true }),
    __metadata("design:type", Number)
], Reservation.prototype, "cantidad_personas", void 0);
__decorate([
    ManyToOne(() => User),
    __metadata("design:type", User)
], Reservation.prototype, "usuario", void 0);
__decorate([
    ManyToOne('Flight'),
    __metadata("design:type", Object)
], Reservation.prototype, "flight", void 0);
Reservation = __decorate([
    Entity({ tableName: 'reservations' })
], Reservation);
export { Reservation };
//# sourceMappingURL=reservation.entity.js.map