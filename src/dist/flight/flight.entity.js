var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, Property, ManyToOne, OneToMany, Collection, Cascade } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Destiny } from '../destiny/destiny.entity.js';
import { Reservation } from '../reservation/reservation.entity.js';
import { Favorite } from '../favorite/favorite.entity.js';
let Flight = class Flight extends BaseEntity {
    constructor() {
        super(...arguments);
        this.reservations = new Collection(this);
        this.favorites = new Collection(this);
    }
};
__decorate([
    Property(),
    __metadata("design:type", Date)
], Flight.prototype, "fechahora_salida", void 0);
__decorate([
    Property(),
    __metadata("design:type", Date)
], Flight.prototype, "fechahora_llegada", void 0);
__decorate([
    Property(),
    __metadata("design:type", Number)
], Flight.prototype, "duracion", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Flight.prototype, "aerolinea", void 0);
__decorate([
    Property({ nullable: false }),
    __metadata("design:type", Number)
], Flight.prototype, "cantidad_asientos", void 0);
__decorate([
    Property({ nullable: false }),
    __metadata("design:type", Number)
], Flight.prototype, "capacidad_restante", void 0);
__decorate([
    Property({ fieldName: 'montoVuelo' }),
    __metadata("design:type", Number)
], Flight.prototype, "montoVuelo", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Flight.prototype, "origen", void 0);
__decorate([
    Property({ nullable: true }),
    __metadata("design:type", Number)
], Flight.prototype, "distancia_km", void 0);
__decorate([
    ManyToOne(() => Destiny),
    __metadata("design:type", Destiny)
], Flight.prototype, "destino", void 0);
__decorate([
    OneToMany(() => Reservation, reservation => reservation.flight, { cascade: [Cascade.REMOVE] }),
    __metadata("design:type", Object)
], Flight.prototype, "reservations", void 0);
__decorate([
    OneToMany(() => Favorite, favorite => favorite.flight, { cascade: [Cascade.REMOVE] }),
    __metadata("design:type", Object)
], Flight.prototype, "favorites", void 0);
Flight = __decorate([
    Entity({ tableName: 'flights' })
], Flight);
export { Flight };
//# sourceMappingURL=flight.entity.js.map