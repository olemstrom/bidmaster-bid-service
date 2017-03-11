import * as Redis from 'ioredis';

import { randomId, isBefore } from './utils';
import { amqp } from './main';

const redis = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST);
const BID_REVIVE_TIME = 5 * 60 * 1000; // Time a bid lifetime is extended with, if bid is sent just before close


export interface Bid {
    id?: string;
    item_id: string;
    bid_amount: number;
}

export interface TotalPrice {
    item_id: string;
    amount: number;
}

const REDIS_IDS = {
    item: (itemId: string) => `item:${itemId}`,
    itemBids: (itemId: string) => `item_bids:${itemId}`,
    bid: (bidId: string) => `bid:${bidId}`
};

const getItemWithBids = (itemId: string): Promise<any> => {
    return redis
        .watch(REDIS_IDS.itemBids(itemId))
        .then(() => {
            return redis.multi()
                .get(REDIS_IDS.item(itemId))
                .lrange(REDIS_IDS.itemBids(itemId), 0, -1)
                .exec()
        })
        .then((res: any[]) => {
            const item = JSON.parse(res[0][1]);
            const bids = res[1][1];
            return {item, bids};
        });

};


export const validateBid = (bid: Bid): Promise<boolean> => {
    return getItemWithBids(bid.item_id)
        .then((data: any) => {
            const close = Date.parse(data.item.estimated_close);
            const now = Date.now();
            return isBefore(now, close);
        });
};

export const acceptBid = (bid: Bid): Promise<Bid> => {
    const bidWithId = Object.assign(bid, { id: randomId(10) });
    return validateBid(bidWithId).then(valid => {
        if(!valid) return amqp.publish('bid.reject', bidWithId).then(() => false);
        return redis
            .watch(REDIS_IDS.itemBids(bidWithId.item_id))
            .then(() => {
                return redis.multi()
                    .set(REDIS_IDS.bid(bidWithId.id), JSON.stringify(bid))
                    .rpush(REDIS_IDS.itemBids(bidWithId.item_id), bidWithId.id)
                    .exec()
            })
            .then(() => amqp.publish('bid.accept', bidWithId))
            .then(() => true)
            .catch((e: Error) => { throw e });
    });
};

export const getBid = (bidId: string): Promise<Bid> => redis.get(REDIS_IDS.bid(bidId)).then((bidJson: string) => JSON.parse(bidJson));

export const getBids = (itemId: string): Promise<Bid[]> => {
    return redis
        .lrange(REDIS_IDS.itemBids((itemId)), 0, -1)
        .then((bids: string[]) => bids.map(getBid))
        .then((bidPromises: Promise<Bid>[]) => Promise.all(bidPromises))
};

export const getItemPrice = (itemId: string): Promise<TotalPrice> => {
    return getBids(itemId).then(bids => ({
        item_id: itemId,
        amount: bids.map(bid => bid.bid_amount).reduce((total, amount) => total + amount)
    }));
};

export const storeItem = (item: any): Promise<any> => redis.set(REDIS_IDS.item(item.id), JSON.stringify(item));
export const getItem = (itemId: any): Promise<any> => redis.get(REDIS_IDS.item(itemId)).then((itemJson: any) => JSON.parse(itemJson));
