import * as KoaRouter from 'koa-router';

import { Context, Request } from 'koa'
import { Bid, getBids } from './bid';

interface RequestWithBody extends Request {
    body: {[key: string]: string };
}

const router = new KoaRouter();


router.get('/api/bids/:item_id', function* (context: Context) {
    try {
        const bids = yield getBids(this.params.item_id);
        if(bids) this.body = { bids };
        else throw new Error('Bid not found by id')
    } catch(err) {
        console.error(err);
        this.status = 500;
        this.body = { status: 'error', message: 'Error trying fetch bids for item ' + this.params.item_id }
    }

    yield context;
});

export const routes = router.routes();