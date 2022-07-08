import mongoose from 'mongoose';
import { OrderCreatedListener } from '../order-created-listener';
import { OrderCreatedEvent, OrderStatus } from '@ticketing-umer/common';
import { natsWrapper } from '../../../nats-wrapper';
import { Ticket } from '../../../models/ticket';
import { Message } from 'node-nats-streaming';

const setup = async () => {
  // Create and save a ticket
  const ticket = await Ticket.build({
    title: 'ticket',
    price: 10,
    userId: '1234',
  }).save();

  // Create the fake data event, and Order document
  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Created,
    userId: '1234',
    expiresAt: '1234',
    version: 0,
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
  };

  // Create fake msg obj
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  // create the instance of listener
  const listener = new (class extends OrderCreatedListener {
    public async listen(): Promise<void> {
      await this.onMessage(data, msg);
    }
    // natsWrapper.client is a mock
  })(natsWrapper.client);

  return { listener, ticket, data, msg };
};

it('sets the orderId of the ticket', async () => {
  const { listener, ticket, data } = await setup();
  await listener.listen();

  const updatedTicket = await Ticket.findById(ticket.id);
  expect(updatedTicket!.orderId).toBe(data.id);
});

it('ack the message', async () => {
  const { listener, msg } = await setup();
  await listener.listen();

  expect(msg.ack).toHaveBeenCalled();
});

it('publishes a ticket updated event', async () => {
  const { listener, data } = await setup();
  await listener.listen();

  // when event is published, this client publish method is being called
  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // json event data
  const ticketUpdatedEventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  expect(ticketUpdatedEventData.orderId).toBe(data.id);
});
