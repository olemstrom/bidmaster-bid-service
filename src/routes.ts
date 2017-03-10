import * as KoaRouter from 'koa-router';

import { Context, Request } from 'koa'

import { Catalog } from './catalog';
import { randomId } from './utils';

interface RequestWithBody extends Request {
    body: {[key: string]: string };
}

const requestToItem = (req: RequestWithBody): Catalog.Item => ({
    id: randomId(10),
    name: req.body['name'],
    description: req.body['description'],
    current_price: parseFloat(req.body['initial_price']),
    estimated_close: new Date(req.body['estimated_close']),
    state: 'OPEN'
});

const router = new KoaRouter();
router.post('/api/item', function* (context: Context) {
    try {
        const result = yield Catalog.add(requestToItem(this.request));
        this.body = { status: 'ok', message: 'Item added successfully', result: result }
    } catch(err) {
        console.error(err);
        this.status = 500;
        this.body = { status: 'error', message: 'Error trying to store item' }
    }
});

router.get('/api/item/:id', function* (context: Context) {
    try {
        const result = yield Catalog.get(this.params.id);
        this.body = { result }
    } catch(err) {
        console.error(err);
        this.status = 500;
        this.body = { status: 'error', message: 'Error trying fetch item ' + this.params.id }
    }
});

export const routes = router.routes();