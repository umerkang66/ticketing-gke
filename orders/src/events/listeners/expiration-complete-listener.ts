import {
  Listener,
  ExpirationCompleteEvent,
  Subjects,
} from '@ticketing-umer/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { Order, OrderStatus } from '../../models/order';
import { OrderCanceledPublisher } from '../publishers/order-canceled-publisher';
import { natsWrapper } from '../../nats-wrapper';

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  protected subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
  protected queueGroupName: string = queueGroupName;

  protected async onMessage(
    data: ExpirationCompleteEvent['data'],
    msg: Message
  ): Promise<void> {
    const order = await Order.findById(data.orderId).populate('ticket');

    if (!order) {
      throw new Error('Order not found');
    }
    if (order.status === OrderStatus.Complete) {
      // if order is already completed return early and ack the message
      return msg.ack();
    }

    // Once the order is canceled, ticket is no longer reserved, see the ticket.ts file in order service, don't remove the ticket on order
    order.set({ status: OrderStatus.Canceled });
    await order.save();

    // Emit the OrderCanceledEvent
    await new OrderCanceledPublisher(natsWrapper.client).publish({
      id: order.id,
      version: order.version,
      ticket: { id: order.ticket.id },
    });

    msg.ack();
  }
}
