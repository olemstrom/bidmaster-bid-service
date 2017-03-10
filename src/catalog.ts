import * as pgPromise from 'pg-promise';

import { publish } from './queue'

const db = pgPromise()({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
});

export namespace Catalog {
    export type ItemState = 'OPEN' | 'CLOSED';

    export interface Item {
        id?: string;
        name: string;
        description: string;
        current_price: number;
        estimated_close: Date;
        state?: ItemState;
    }

    export const add = (item: Item): Promise<any> => {
        return db.query(`
            INSERT INTO items(id, name, description, current_price, state)
                VALUES($(id), $(name), $(description), $(current_price), $(state))
            RETURNING id, name, description, current_price, state
        `, item)
            .then((res) => res[0])
            .then((insertedItem: Item) => publish('catalog.add', { item: insertedItem }))
            .catch((err: Error) => {
                console.error(err);
                throw err;
            });
    };

    export const get = (id: string): Promise<Item> => {
        return db.one('SELECT * FROM items WHERE id=$(id)', {id})
            .catch((err) => {
                console.error('User not found by id', id);
                throw err;
            });

    };
}
