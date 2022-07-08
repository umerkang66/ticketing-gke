import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { natsWrapper } from '../../nats-wrapper';
import { Ticket } from '../../models/ticket';

it('returns a 404 if the provided id does not exist', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', getAuthCookie())
    .send({ title: 'first', price: 10 })
    .expect(404);
});

it('returns a 401 if the user is not authenticated', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  await request(app)
    .put(`/api/tickets/${id}`)
    .send({ title: 'first', price: 10 })
    .expect(401);
});

it('returns a 401 if if the user does not own the ticket', async () => {
  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', getAuthCookie())
    .send({ title: 'first', price: 10 });

  await request(app)
    .put(`/api/tickets/${res.body.id}`)
    // totally different user
    .set('Cookie', getAuthCookie())
    .send({ title: 'new_title', price: 200 })
    .expect(401);
});

it('returns a 400 if user provided an invalid title of price', async () => {
  const userCookie = getAuthCookie();

  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', userCookie)
    .send({ title: 'first', price: 10 });

  await request(app)
    .put(`/api/tickets/${res.body.id}`)
    .set('Cookie', userCookie)
    .send({ title: '', price: 10 })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${res.body.id}`)
    .set('Cookie', userCookie)
    .send({ title: 'second', price: -10 })
    .expect(400);
});

it('updates a ticket, provided the valid inputs', async () => {
  const userCookie = getAuthCookie();

  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', userCookie)
    .send({ title: 'first', price: 10 });

  await request(app)
    .put(`/api/tickets/${res.body.id}`)
    .set('Cookie', userCookie)
    .send({ title: 'second', price: 100 })
    .expect(200);

  const ticketRes = await request(app)
    .get(`/api/tickets/${res.body.id}`)
    .send();

  expect(ticketRes.body.title).toBe('second');
  expect(ticketRes.body.price).toBe(100);
});

it('publishes an event', async () => {
  const userCookie = getAuthCookie();

  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', userCookie)
    .send({ title: 'first', price: 10 });

  await request(app)
    .put(`/api/tickets/${res.body.id}`)
    .set('Cookie', userCookie)
    .send({ title: 'second', price: 100 })
    .expect(200);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it('rejects updates if the ticket is reserved', async () => {
  const userCookie = getAuthCookie();

  // Create the ticket
  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', userCookie)
    .send({ title: 'first', price: 10 });

  const ticket = await Ticket.findById(res.body.id);
  ticket!.set({ orderId: new mongoose.Types.ObjectId().toHexString() });
  await ticket!.save();

  // because orderId is defined (ticket is reserved) we cannot edit the ticket
  await request(app)
    .put(`/api/tickets/${res.body.id}`)
    .set('Cookie', userCookie)
    .send({ title: 'second', price: 100 })
    .expect(400);
});
