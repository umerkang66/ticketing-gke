import { OrderCanceledEvent, Subjects, Listener } from '@ticketing-umer/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { Order, OrderStatus } from '../../models/order';

export class OrderCanceledListener extends Listener<OrderCanceledEvent> {
  protected subject: Subjects.OrderCanceled = Subjects.OrderCanceled;
  protected queueGroupName: string = queueGroupName;

  protected async onMessage(
    data: OrderCanceledEvent['data'],
    msg: Message
  ): Promise<void> {
    const order = await Order.findByEvent({
      id: data.id,
      version: data.version,
    });
    if (!order) {
      throw new Error('Order not found');
    }

    // set the order of payment service status to canceled
    order.set({ status: OrderStatus.Canceled });
    await order.save();

    msg.ack();
  }
}
