var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, Property, OneToMany, Collection, Cascade } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Flight } from '../flight/flight.entity.js';
let Destiny = class Destiny extends BaseEntity {
    constructor() {
        super(...arguments);
        this.flights = new Collection(this);
    }
};
__decorate([
    Property({ nullable: false, unique: false }),
    __metadata("design:type", String)
], Destiny.prototype, "nombre", void 0);
__decorate([
    Property({ nullable: true }),
    __metadata("design:type", String)
], Destiny.prototype, "imagen", void 0);
__decorate([
    Property({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], Destiny.prototype, "transporte", void 0);
__decorate([
    Property({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], Destiny.prototype, "actividades", void 0);
__decorate([
    OneToMany(() => Flight, flight => flight.destino, { cascade: [Cascade.PERSIST, Cascade.REMOVE] }),
    __metadata("design:type", Object)
], Destiny.prototype, "flights", void 0);
Destiny = __decorate([
    Entity({ tableName: 'destinies' })
], Destiny);
export { Destiny };
//# sourceMappingURL=destiny.entity.js.map