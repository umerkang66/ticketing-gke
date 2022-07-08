import Queue from 'bull';
import { ExpirationCompletePublisher } from '../events/publishers/expiration-complete-publisher';
import { natsWrapper } from '../nats-wrapper';

interface Payload {
  orderId: string;
}

const expirationQueue = new Queue<Payload>('order:expiration', {
  redis: { host: process.env.REDIS_HOST },
});

// Job is published in redis from order-created-listener.ts
expirationQueue.process(async job => {
  // Receive job from redis, then publish expiration:complete event

  await new ExpirationCompletePublisher(natsWrapper.client).publish({
    orderId: job.data.orderId,
  });
});

export { expirationQueue };
