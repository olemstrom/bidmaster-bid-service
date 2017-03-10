import * as amqp from 'amqplib';
import { Channel, Connection, Replies, Message } from 'amqplib'
import { BehaviorSubject, Subject, Observable } from 'rxjs/Rx'

const openConnection: Promise<amqp.Connection> = amqp.connect(process.env.AMQP_URL);
const channel: Promise<amqp.Channel> = openConnection.then((c: Connection): Promise<Channel> => c.createChannel());


const sendToQueue = (topic: string, message: any, channel: Channel) => channel.assertQueue(topic).then(ok => channel.sendToQueue(topic, new Buffer(message)));

const consume = (topic: string, channel: Channel) => {
    const sub: Subject<any> = new BehaviorSubject(undefined);

    channel.assertQueue(topic).then(ok => channel.consume(topic, (msg: Message) => {
        if(msg) {
            sub.next(msg.content.toString());
            channel.ack(msg);
        }
    }));

    return sub.asObservable();
};

export const publish = (topic: string, message: {}) => {
    const send = sendToQueue.bind(null, topic, JSON.stringify(message));
    return channel.then(send).catch(console.warn);
};

export const listen = (topic: string): Observable<any> => Observable.fromPromise(channel)
        .switchMap(consume.bind(null, topic))
        .filter(val => Boolean(val));

