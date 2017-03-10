import * as KoaRouter from 'koa-router';

import { Context, Request } from 'koa'
import { Bid, getBids, acceptBid, validateBid } from './bid';
import { publish } from './queue';


interface RequestWithBody extends Request {
    body: {[key: string]: string };
}

const router = new KoaRouter();

const createBid = (koaObj: any): Bid => {
    const bid: Bid = {
        item_id: koaObj.params.item_id,
        bid_amount: koaObj.request.body['amount']
    };

    if(!bid.bid_amount) throw new Error('No bid amount set!');
    else return bid;
};


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

router.post('/api/bid/:item_id', function* (context: Context) {
    try {
        const bid = createBid(this);
        const isValid = yield validateBid(bid);

        yield publish('bid.valid', bid);

        const message = isValid ? 'Bid validated' : 'Bid was not valid - Bidding has already closed';
        this.body = { status: 'ok', message };
    } catch(err) {
        console.error(err);
        this.status = 500;
        this.body = { status: 'error', message: 'Error trying to set bid for item ' + this.params.item_id }
    }

    yield context;
});

export const routes = router.routes();