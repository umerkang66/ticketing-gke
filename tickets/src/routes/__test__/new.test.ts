import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
// fake natsWrapper
import { natsWrapper } from '../../nats-wrapper';

it('has a route handler listening to /api/tickets for post requests', async () => {
  const res = await request(app).post('/api/tickets').send({});

  expect(res.status).not.toBe(404);
});

it('can only be accessed if the user is signed in', async () => {
  await request(app).post('/api/tickets').send({}).expect(401);
});

it('return status other than 401, if user is signed in', async () => {
  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', getAuthCookie())
    .send({});

  expect(res.status).not.toBe(401);
});

it('return an error if invalid title is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', getAuthCookie())
    .send({ title: '', price: 10 })
    .expect(400);

  await request(app)
    .post('/api/tickets')
    .set('Cookie', getAuthCookie())
    .send({ price: 10 })
    .expect(400);
});

it('returns an error if invalid price is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', getAuthCookie())
    .send({ title: 'first ticket', price: -10 })
    .expect(400);

  await request(app)
    .post('/api/tickets')
    .set('Cookie', getAuthCookie())
    .send({ title: 'first ticket' })
    .expect(400);
});

it('creates a ticket with valid inputs', async () => {
  let tickets = await Ticket.find({});
  expect(tickets.length).toBe(0);

  await request(app)
    .post('/api/tickets')
    .set('Cookie', getAuthCookie())
    .send({ title: 'first ticket', price: 10 })
    .expect(201);

  tickets = await Ticket.find({});
  expect(tickets.length).toBe(1);
});

it('publishes an event', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', getAuthCookie())
    .send({ title: 'first ticket', price: 10 })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
