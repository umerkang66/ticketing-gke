import request from 'supertest';
import { app } from '../../app';

it('returns a 201 on successful signup', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({ email: 'test@test.com', password: 'password' })
    .expect(201);
});

it('returns a 400 with an invalid email', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({ email: 'test.test.com', password: 'password' })
    .expect(400);
});

it('returns a 400 with an invalid password', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({ email: 'test@test.com', password: 'pas' })
    .expect(400);
});

it('returns a 400 with missing email and password', async () => {
  await request(app).post('/api/users/signup').send({}).expect(400);

  await request(app)
    .post('/api/users/signup')
    .send({ email: 'test@test.com' })
    .expect(400);

  await request(app)
    .post('/api/users/signup')
    .send({ password: 'password' })
    .expect(400);
});

it('disallows duplicate emails', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({ email: 'test@test.com', password: 'password' })
    .expect(201);

  await request(app)
    .post('/api/users/signup')
    .send({ email: 'test@test.com', password: 'password' })
    .expect(400);
});

it('sets a cookie after successful signup', async () => {
  const res = await request(app)
    .post('/api/users/signup')
    .send({ email: 'test@test.com', password: 'password' })
    .expect(201);

  // when cookie is being set, it just sends the Set-Cookie header to the browser, in dev env, it only happens on https
  expect(res.get('Set-Cookie')).toBeDefined();
});
