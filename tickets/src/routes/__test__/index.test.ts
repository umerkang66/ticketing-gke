import request from 'supertest';
import { app } from '../../app';

const createTicket = async (title: string, price: number) => {
  await request(app)
    .post('/api/tickets')
    .send({ title: 'first', price: 10 })
    .set('Cookie', getAuthCookie())
    .expect(201);
};

it('can fetch a list of tickets', async () => {
  await createTicket('first', 10);
  await createTicket('second', 20);
  await createTicket('third', 30);

  const res = await request(app).get('/api/tickets').send().expect(200);
  expect(res.body.length).toBe(3);
});
