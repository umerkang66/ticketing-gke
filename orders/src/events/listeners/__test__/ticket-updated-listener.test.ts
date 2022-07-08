import mongoose from 'mongoose';
import { TicketUpdatedEvent } from '@ticketing-umer/common';
import { TicketUpdatedListener } from '../ticket-updated-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { Ticket } from '../../../models/ticket';

const setup = async () => {
  // create and save a ticket
  const ticket = await Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'ticket',
    price: 10,
  }).save();

  // create a fake data event
  const data: TicketUpdatedEvent['data'] = {
    id: ticket.id,
    version: ticket.version + 1,
    title: 'ticket_2',
    price: 20,
    userId: new mongoose.Types.ObjectId().toHexString(),
  };

  // create a fake msg object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  // create an instance of the listener
  const listener = new (class extends TicketUpdatedListener {
    public async listen(): Promise<void> {
      await this.onMessage(data, msg);
    }
  })(natsWrapper.client);

  return { listener, ticket, data, msg };
};

it('finds, updates, and saves a ticket', async () => {
  const { listener, data, ticket } = await setup();
  await listener.listen();

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket!.title).toBe(data.title);
  expect(updatedTicket!.price).toBe(data.price);
  expect(updatedTicket!.version).toBe(data.version);
});

it('ack the message', async () => {
  const { listener, msg } = await setup();
  // call the onMessage function with the data + msg by calling listen on listener
  await listener.listen();

  // write assertions to make sure ack function is called
  expect(msg.ack).toHaveBeenCalled();
});

it("doesn't not call ack if the event has a skipped version number", async () => {
  const { msg, data, listener } = await setup();
  // after updating, the correct version should be 2, but this is 10
  data.version = 10;

  try {
    await listener.listen();
  } catch (err) {
    // catch the error, and don't use it
  }

  expect(msg.ack).not.toHaveBeenCalled();
});
