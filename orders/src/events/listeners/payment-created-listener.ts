import {
  Subjects,
  Listener,
  PaymentCreatedEvent,
} from '@ticketing-umer/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { Order, OrderStatus } from '../../models/order';
import { OrderCompletedPublisher } from '../publishers/order-completed-publisher';
import { natsWrapper } from '../../nats-wrapper';

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  protected subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
  protected queueGroupName: string = queueGroupName;

  protected async onMessage(
    data: PaymentCreatedEvent['data'],
    msg: Message
  ): Promise<void> {
    const order = await Order.findById(data.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.set({ status: OrderStatus.Complete });
    await order.save();

    await new OrderCompletedPublisher(natsWrapper.client).publish({
      id: order.id,
      status: OrderStatus.Complete,
      version: order.version,
    });

    // Here version is updated, in ideal situation, we have to send OrderUpdatedEvent (to something like payment service), but on this application, after this order is complete, so there is no need
    msg.ack();
  }
}
