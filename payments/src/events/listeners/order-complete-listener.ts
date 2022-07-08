import { Listener, OrderCompleteEvent, Subjects } from '@ticketing-umer/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { Order } from '../../models/order';

export class OrderCompleteListener extends Listener<OrderCompleteEvent> {
  protected subject: Subjects.OrderComplete = Subjects.OrderComplete;
  protected queueGroupName: string = queueGroupName;

  protected async onMessage(
    data: OrderCompleteEvent['data'],
    msg: Message
  ): Promise<void> {
    const order = await Order.findOne({
      _id: data.id,
      version: data.version - 1,
    });
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = data.status;
    await order.save();
    msg.ack();
  }
}
