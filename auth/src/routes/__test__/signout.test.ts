import request from 'supertest';
import { app } from '../../app';

it('clears the cookie after signing out', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({ email: 'test@test.com', password: 'password' })
    .expect(201);

  const res = await request(app)
    .post('/api/users/signout')
    .send({})
    .expect(200);

  // it will send the set-cookie to the browser, with an empty session
  expect(res.get('Set-Cookie')).toBeDefined();
});
