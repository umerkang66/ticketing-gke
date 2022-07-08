import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

const buildTicket = async (title: string, price: number) => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title,
    price,
  });
  await ticket.save();

  return ticket;
};

const createOrder = async (cookie: string[], ticketId: string) => {
  return await request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({ ticketId })
    .expect(201);
};

it('fetches orders for a particular user', async () => {
  // Create three tickets
  const ticket1 = await buildTicket('ticket_1', 10);
  const ticket2 = await buildTicket('ticket_2', 20);
  const ticket3 = await buildTicket('ticket_3', 30);

  // Create two users
  const user1 = getAuthCookie();
  const user2 = getAuthCookie();

  // Create orders
  await createOrder(user1, ticket1.id);
  const { body: order1 } = await createOrder(user2, ticket2.id);
  const { body: order2 } = await createOrder(user2, ticket3.id);

  // Make request to get orders of user #2
  const res = await request(app)
    .get('/api/orders')
    .set('Cookie', user2)
    .send()
    .expect(200);

  // Make sure we got orders for user #2
  expect(res.body.length).toBe(2);
  // first order doesn't have a name
  expect(res.body[0].id).toBe(order1.id);
  expect(res.body[1].id).toBe(order2.id);
  expect(res.body[0].ticket.id).toBe(ticket2.id);
  expect(res.body[1].ticket.id).toBe(ticket3.id);
});
