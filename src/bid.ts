import { randomId } from './utils';

export interface Bid {
    id?: string;
    item_id: string;
    valid_until: Date;
    bid_amount: number;
}

export const store: {[key: string]: Bid[]} = {};
export const acceptBid = (bid: Bid) => {
    const bids = store[bid.item_id] = store[bid.item_id] || [];
    const bidWithId = Object.assign(bid, { id: randomId(10) });
    bids.unshift(bidWithId);
    return bidWithId;
};


