import * as dotenv from 'dotenv';
dotenv.config();

import * as Koa from 'koa';
import * as json from 'koa-json';
import * as bodyparser from 'koa-bodyparser';

import { routes } from './routes';
import { listen } from './queue';
import {Bid, acceptBid} from "./bid";

const app = new Koa();

console.log('Starting bid service');

app.use(json({ pretty: false }));
app.use(bodyparser());
app.use(routes);
app.listen(process.env.PORT || '8080');

const itemToBid = (item: any): Bid => ({
    item_id: item.id,
    valid_until: new Date(item.estimated_close),
    bid_amount: item.current_price
});

listen('catalog.add')
    .map(msg => JSON.parse(msg))
    .map(msg => msg.item)
    .do(item => console.log(item))
    .map(item => itemToBid(item))
    .do(acceptBid)
    .subscribe(bid => console.log(bid));