import { OrderCreatedEvent } from '@ticketing-umer/common';
import { Order, OrderStatus } from '../../../models/order';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { OrderCreatedListener } from '../order-created-listener';
import { natsWrapper } from '../../../nats-wrapper';

const setup = async () => {
  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    expiresAt: 'asdf',
    userId: 'asdf',
    status: OrderStatus.Created,
    ticket: { id: 'asdf', price: 10 },
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  const listener = new (class extends OrderCreatedListener {
    public async listen(): Promise<void> {
      await this.onMessage(data, msg);
    }
  })(natsWrapper.client);

  return { listener, data, msg };
};

it('replicates the order info', async () => {
  const { listener, data } = await setup();
  await listener.listen();

  const updatedOrder = await Order.findById(data.id);
  expect(updatedOrder!.price).toBe(data.ticket.price);
});

it('ack the message', async () => {
  const { listener, msg } = await setup();
  await listener.listen();

  expect(msg.ack).toHaveBeenCalled();
});
