import { Listener, OrderCreatedEvent, Subjects } from '@ticketing-umer/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { Order } from '../../models/order';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  protected subject: Subjects.OrderCreated = Subjects.OrderCreated;
  protected queueGroupName: string = queueGroupName;

  protected async onMessage(
    data: OrderCreatedEvent['data'],
    msg: Message
  ): Promise<void> {
    const order = Order.build({
      id: data.id,
      price: data.ticket.price,
      status: data.status,
      userId: data.userId,
      version: data.version,
    });
    await order.save();

    msg.ack();
  }
}
