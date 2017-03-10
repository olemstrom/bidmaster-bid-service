import * as dotenv from 'dotenv';
dotenv.config();

import * as Koa from 'koa';
import * as json from 'koa-json';
import * as bodyparser from 'koa-bodyparser';

import { routes } from './routes';
import { listen } from './queue';
import { Catalog } from './catalog';

const app = new Koa();

console.log('Starting catalog service');

app.use(json({ pretty: false }));
app.use(bodyparser());
app.use(routes);
app.listen(process.env.PORT || '8080');

listen('catalog.add')
    .map(msg => JSON.parse(msg))
    .map(msg => msg.item)
    .map(item => item.id)
    .switchMap(Catalog.get)
    .subscribe(msg => console.log(msg));