import { OrderCanceledEvent } from '@ticketing-umer/common';
import { Order, OrderStatus } from '../../../models/order';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCanceledListener } from '../order-canceled-listener';

const setup = async () => {
  // Create an Order, and Saves to db
  const order = await Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    userId: 'asdf',
    price: 10,
    status: OrderStatus.Created,
  }).save();

  // Create an orderCanceledEventData
  const data: OrderCanceledEvent['data'] = {
    id: order.id,
    version: order.version + 1,
    ticket: { id: 'asdf' },
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  const listener = new (class extends OrderCanceledListener {
    public async listen(): Promise<void> {
      await this.onMessage(data, msg);
    }
  })(natsWrapper.client);

  return { listener, order, data, msg };
};

it('set the status to canceled', async () => {
  const { listener, data } = await setup();
  await listener.listen();

  // when onMessage is called, that updates the order, and again version is increased, so we have to add 2 to order.version (or 1 to data.version)
  const updatedOrder = await Order.findByEvent({
    id: data.id,
    version: data.version + 1,
  });

  expect(updatedOrder!.status).toBe(OrderStatus.Canceled);
});

it('ack the message', async () => {
  const { listener, msg } = await setup();
  await listener.listen();

  expect(msg.ack).toHaveBeenCalled();
});
