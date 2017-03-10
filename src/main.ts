import * as dotenv from 'dotenv';
dotenv.config();

import * as Koa from 'koa';
import * as json from 'koa-json';
import * as bodyparser from 'koa-bodyparser';
import { Observable } from 'rxjs/Rx';

import { routes } from './routes';
import { listen, publish } from './queue';
import { Bid, acceptBid, storeItem, validateBid } from "./bid";

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

listen('catalog.add')
    .map(msg => JSON.parse(msg))
    .map(msg => msg.item)
    .do(storeItem)
    .map(item => itemToBid(item))
    .switchMap((bid: Bid) => Observable.fromPromise(validateBid(bid)).map(valid => ({ bid, valid }) ))
    .filter((validatedBid: any) => validatedBid.valid)
    .map((validatedBid: any) => validatedBid.bid)
    .do((bid: Bid) => publish('bid.accept', bid))
    .subscribe(
        bid => console.log('New item received', bid),
        err => console.error(err)
);

listen('bid.accept')
    .map(msg => JSON.parse(msg))
    .do(acceptBid)
    .subscribe(
        bid => console.log('Bid accepted', bid),
        err => console.error(err)
    );