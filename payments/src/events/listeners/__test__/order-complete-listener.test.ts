import { OrderCompleteEvent } from '@ticketing-umer/common';
import { Order, OrderStatus } from '../../../models/order';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCompleteListener } from '../order-complete-listener';

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
  const data: OrderCompleteEvent['data'] = {
    id: order.id,
    version: order.version + 1,
    status: OrderStatus.Complete,
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  const listener = new (class extends OrderCompleteListener {
    public async listen(): Promise<void> {
      await this.onMessage(data, msg);
    }
  })(natsWrapper.client);

  return { listener, data, msg };
};

it('sets the order status to complete', async () => {
  const { listener, data } = await setup();
  await listener.listen();

  // updated order is already updated in onMessage method, so now it is equal to the version of event data
  // finding by event is optional, we can just find it by id
  const updatedOrder = await Order.findOne({
    _id: data.id,
    version: data.version,
  });
  expect(updatedOrder!.status).toBe(OrderStatus.Complete);
});

it('ack the message', async () => {
  const { listener, msg } = await setup();
  await listener.listen();

  expect(msg.ack).toHaveBeenCalled();
});
