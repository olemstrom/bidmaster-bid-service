import * as Redis from 'ioredis';

import { randomId } from './utils';

const redis = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST);

export interface Bid {
    id?: string;
    item_id: string;
    valid_until: Date;
    bid_amount: number;
}

export interface TotalPrice {
    item_id: string;
    amount: number;
}

export const acceptBid = (bid: Bid): Promise<Bid> => {
    const bidWithId = Object.assign(bid, { id: randomId(10) });
    return redis
        .multi()
        .set(`bid:${bidWithId.id}`, bid)
        .rpush(`item_bids:${bidWithId.item_id}`, bidWithId.id)
        .exec()
        .then(() => bidWithId);
};

export const getBid = (bidId: string): Promise<Bid> => redis.get(`bid:${bidId}`)

export const getBids = (itemId: string): Promise<Bid[]> => {
    return redis
        .get(`item_bids:${itemId}`)
        .then((bids: string[]) => bids.map(getBid));
};

export const getItemPrice = (itemId: string): Promise<TotalPrice> => {
    return getBids(itemId).then(bids => ({
        item_id: itemId,
        amount: bids.map(bid => bid.bid_amount).reduce((total, amount) => total + amount)
    }));
};


