const request = require('request');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST);

const getBids = (itemId) => {
    return new Promise((resolve, reject) => {
        request.get('http://localhost:8081/api/bids/' + itemId, (err, res, body) => {
            if(!err) resolve(body);
        }).on('error', reject)
    })
};

const bidItem = (itemId) => {

    return new Promise((resolve, reject) => {
        request.post('http://localhost:8081/api/bid/' + itemId, (err, res, body) => {
            if(!err) resolve(body);
        }).on('error', reject)
    })

}

redis.keys('*item_bids*')
    .then(res => res[0])
    .then(id => id.replace('item_bids:', ''))
    .then((itemId) => {
        return getBids(itemId)
            .then((bids) => { console.log('Bids 1', bids); return bids; })
            .then(() => bidItem(itemId))
            .then(() => getBids(itemId))
            .then(bids => { console.log('Bids 2', bids); return bids; })
            .catch((error) => console.error(error))
    })
    .then(() => process.exit(0))
    .catch(error => console.error());