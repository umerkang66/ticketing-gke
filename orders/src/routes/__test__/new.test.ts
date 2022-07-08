import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { Ticket } from '../../models/ticket';
// this is a fake import
import { natsWrapper } from '../../nats-wrapper';

it("returns an error, if ticket doesn't exit", async () => {
  const ticketId = new mongoose.Types.ObjectId();

  await request(app)
    .post('/api/orders')
    .set('Cookie', getAuthCookie())
    .send({ ticketId })
    .expect(404);
});

it('returns an error, if the ticket is already reserved', async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'first ticket',
    price: 10,
  });
  await ticket.save();

  const expiration = new Date();
  expiration.setSeconds(expiration.getSeconds() + 15 * 60);

  const order = Order.build({
    ticket,
    userId: 'random_id',
    status: OrderStatus.Created,
    // expiration service will mark the status of Order to be expired, so we can assert the status in expiration test files
    expiresAt: expiration,
  });
  await order.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', getAuthCookie())
    .send({ ticketId: ticket.id })
    .expect(400);
});

it('reserves a ticket', async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'first ticket',
    price: 10,
  });
  await ticket.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', getAuthCookie())
    .send({ ticketId: ticket.id })
    .expect(201);
});

it('emits an order created event', async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'first ticket',
    price: 10,
  });
  await ticket.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', getAuthCookie())
    .send({ ticketId: ticket.id })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
