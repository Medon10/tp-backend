import { Entity, ManyToOne, Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { User } from '../user/user.entity.js';
import { Flight } from '../flight/flight.entity.js';

@Entity({ tableName: 'favorites' })
export class Favorite extends BaseEntity {
  @ManyToOne('Flight')
    flight!: Rel<Flight>;

  @ManyToOne(() => User)
  user!: Rel<User>;
}