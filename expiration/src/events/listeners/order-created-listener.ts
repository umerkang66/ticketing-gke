import { Listener, OrderCreatedEvent, Subjects } from '@ticketing-umer/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { expirationQueue } from '../../queues/expiration-queue';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  protected subject: Subjects.OrderCreated = Subjects.OrderCreated;
  protected queueGroupName: string = queueGroupName;

  protected async onMessage(
    data: OrderCreatedEvent['data'],
    msg: Message
  ): Promise<void> {
    // add payload into queue (publish a job), that will go to redis-server, then it will be receive in expiration.process callback

    // delay means send the event back to expiration service (from redis) after delay time (in expiration.process callback)
    const delay = new Date(data.expiresAt).getTime() - new Date().getTime();
    await expirationQueue.add({ orderId: data.id }, { delay });

    msg.ack();
  }
}
