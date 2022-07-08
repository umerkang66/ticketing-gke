import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { ExpirationCompleteEvent } from '@ticketing-umer/common';
import { Order, OrderStatus } from '../../../models/order';
import { Ticket } from '../../../models/ticket';
import { ExpirationCompleteListener } from '../expiration-complete-listener';
import { natsWrapper } from '../../../nats-wrapper';

const setup = async () => {
  // Create ticket and created order with it
  const ticket = await Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  }).save();

  const order = await Order.build({
    status: OrderStatus.Created,
    userId: 'asdf',
    expiresAt: new Date(),
    ticket: ticket.id,
  }).save();

  const data: ExpirationCompleteEvent['data'] = {
    orderId: order.id,
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  // Create the listener
  const listener = new (class extends ExpirationCompleteListener {
    public async listen(): Promise<void> {
      await this.onMessage(data, msg);
    }
  })(natsWrapper.client);

  return { listener, data, msg, ticket, order };
};

it('updates the order status to canceled', async () => {
  const { listener, order } = await setup();
  await listener.listen();

  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder!.status).toBe(OrderStatus.Canceled);
});

it('emits an OrderCanceledEvent', async () => {
  const { listener, order } = await setup();
  await listener.listen();

  expect(natsWrapper.client.publish as jest.Mock).toHaveBeenCalled();

  const eventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  expect(eventData.id).toBe(order.id);
});

it('ack the message', async () => {
  const { listener, msg } = await setup();
  await listener.listen();

  expect(msg.ack).toHaveBeenCalled();
});
