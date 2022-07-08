import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { PaymentCreatedEvent } from '@ticketing-umer/common';
import { Order, OrderStatus } from '../../../models/order';
import { Ticket } from '../../../models/ticket';
import { natsWrapper } from '../../../nats-wrapper';
import { PaymentCreatedListener } from '../payment-created-listener';

const setup = async () => {
  const ticket = await Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'ticket',
    price: 10,
  }).save();

  const order = await Order.build({
    status: OrderStatus.Created,
    userId: 'asdf',
    expiresAt: new Date(),
    ticket: ticket.id,
  }).save();

  const data: PaymentCreatedEvent['data'] = {
    id: 'asdf',
    stripeId: 'asdf',
    orderId: order.id,
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  // Create the listener
  const listener = new (class extends PaymentCreatedListener {
    public async listen(): Promise<void> {
      await this.onMessage(data, msg);
    }
  })(natsWrapper.client);

  return { listener, data, msg, order, ticket };
};

it('updates the order status to complete', async () => {
  const { listener, order } = await setup();
  await listener.listen();

  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder!.status).toBe(OrderStatus.Complete);
});

it('publishes the OrderCompleteEvent', async () => {
  const { listener, order } = await setup();
  await listener.listen();

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const eventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  expect(eventData.id).toBe(order.id);
  expect(eventData.status).toBe(OrderStatus.Complete);
  // once it is updates in onMessage call, version is increased by one
  expect(eventData.version).toBe(order.version + 1);
});

it('ack the message', async () => {
  const { listener, msg } = await setup();
  await listener.listen();

  expect(msg.ack).toHaveBeenCalled();
});
