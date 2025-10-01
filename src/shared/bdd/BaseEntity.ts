import { PrimaryKey, Property } from '@mikro-orm/core';

export abstract class BaseEntity {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property({ type: 'date', onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ type: 'date', onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}