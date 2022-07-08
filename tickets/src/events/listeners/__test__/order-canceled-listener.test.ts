import mongoose from 'mongoose';
import { OrderCanceledEvent } from '@ticketing-umer/common';
import { OrderCanceledListener } from '../order-canceled-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { Ticket } from '../../../models/ticket';
import { Message } from 'node-nats-streaming';

const setup = async () => {
  const orderId = new mongoose.Types.ObjectId().toHexString();
  const ticket = Ticket.build({
    title: 'ticket',
    price: 20,
    userId: 'asdf',
  });
  // In reality, at the time of creating tickets, there should be no orders
  ticket.set({ orderId });
  await ticket.save();

  // Order event data
  const data: OrderCanceledEvent['data'] = {
    id: orderId,
    version: 0,
    ticket: { id: ticket.id },
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

  return { msg, data, ticket, orderId, listener };
};

it('updates the ticket', async () => {
  const { ticket, listener } = await setup();
  await listener.listen();

  const updatedTicket = await Ticket.findById(ticket.id);
  expect(updatedTicket?.orderId).not.toBeDefined();
});

it('ack the message', async () => {
  const { msg, listener } = await setup();
  await listener.listen();

  expect(msg.ack).toHaveBeenCalled();
});

it('publishes an event', async () => {
  const { data, listener } = await setup();
  await listener.listen();

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // json event data
  const ticketUpdatedEventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  expect(ticketUpdatedEventData.orderId).not.toBeDefined();
});
