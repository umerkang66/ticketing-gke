import { TicketCreatedEvent } from '@ticketing-umer/common';
import mongoose from 'mongoose';

import { TicketCreatedListener } from '../ticket-created-listener';
// This is a mock library
import { natsWrapper } from '../../../nats-wrapper';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../../models/ticket';

const setup = () => {
  // create a fake data event
  const data: TicketCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'ticket',
    price: 10,
    userId: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
  };

  // create a fake msg object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  // create an instance of the listener
  const listener = new (class extends TicketCreatedListener {
    public async listen(): Promise<void> {
      await this.onMessage(data, msg);
    }
  })(natsWrapper.client);

  return { listener, data, msg };
};

it('creates and saves a ticket', async () => {
  const { listener, data } = setup();
  // call the onMessage function with the data + msg by calling listen on listener
  await listener.listen();

  // write assertion, to make sure ticket was created
  const ticket = await Ticket.findById(data.id);
  expect(ticket).toBeDefined();
  expect(ticket!.title).toBe(data.title);
  expect(ticket!.price).toBe(data.price);
});

it('ack the message', async () => {
  const { listener, msg } = setup();
  // call the onMessage function with the data + msg by calling listen on listener
  await listener.listen();

  // write assertions to make sure ack function is called
  expect(msg.ack).toHaveBeenCalled();
});
