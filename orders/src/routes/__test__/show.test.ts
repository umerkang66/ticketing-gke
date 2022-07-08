import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

it('fetches the order', async () => {
  // Create a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'ticket',
    price: 20,
  });
  await ticket.save();

  // make a request to build an order with this ticket
  const user = getAuthCookie();

  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201);

  // make a request to fetch the user
  const { body: fetchedOrder } = await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(200);

  expect(fetchedOrder.id).toBe(order.id);
});

it('returns an error if one user tries to fetch another users order', async () => {
  // Create a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'ticket',
    price: 20,
  });
  await ticket.save();

  // make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', getAuthCookie())
    .send({ ticketId: ticket.id })
    .expect(201);

  // make a request to fetch the user
  await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', getAuthCookie())
    .send()
    .expect(401);
});
