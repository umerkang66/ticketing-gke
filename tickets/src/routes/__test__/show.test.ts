import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';

it('returns a 404 if the ticket is not found', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app).get(`/api/tickets/${id}`).send().expect(404);
});

it('returns the ticket if the ticket is found', async () => {
  const title = 'concert';
  const price = 20;

  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', getAuthCookie())
    .send({ title, price })
    .expect(201);

  const ticketRes = await request(app)
    .get(`/api/tickets/${res.body.id}`)
    .send()
    .expect(200);

  expect(ticketRes.body.title).toBe(title);
  expect(ticketRes.body.price).toBe(price);
});
