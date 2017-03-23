import * as dotenv from 'dotenv';
dotenv.config();

import * as Koa from 'koa';
import * as json from 'koa-json';
import * as bodyparser from 'koa-bodyparser';
import { Observable } from 'rxjs/Rx';

import { routes } from './routes';
import { AmqpConnector } from 'amqp-connector';

import { Bid, acceptBid, storeItem, validateBid } from "./bid";

export const amqp = new AmqpConnector(process.env.AMQP_URL, 'bid-service', { type: 'topic', name: 'bidmaster-ex' });

const app = new Koa();

console.log('Starting bid service');

app.use(json({ pretty: false }));
app.use(bodyparser());
app.use(routes);
app.listen(process.env.PORT || '8080');

const itemToBid = (item: any): Bid => ({
    item_id: item.id,
    bid_amount: item.current_price
});

amqp.listen('catalog.add')
    .map(msg => JSON.parse(msg))
    .map(msg => msg.item)
    .do(() => console.log('storing item...'))
    .do(storeItem)
    .map(item => itemToBid(item))
    .do(() => console.log('validating item...'))
    .switchMap((bid: Bid) => Observable.fromPromise(validateBid(bid)).map(valid => ({ bid, valid }) ))
    .filter((validatedBid: any) => validatedBid.valid)
    .map((validatedBid: any) => validatedBid.bid)
    .do(acceptBid)
    .catch(err => Observable.throw(err))
    .subscribe(
        bid => console.log('New item received', bid),
        err => console.error(err)
);