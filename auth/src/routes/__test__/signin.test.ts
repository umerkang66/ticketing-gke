import request from 'supertest';
import { app } from '../../app';

// Validation tests
it('returns a 400 with an invalid email', async () => {
  await request(app)
    .post('/api/users/signin')
    .send({ email: 'test.test.com', password: 'password' })
    .expect(400);
});

it('returns a 400 with an invalid password', async () => {
  await request(app)
    .post('/api/users/signin')
    .send({ email: 'test@test.com', password: '' })
    .expect(400);
});

it('returns a 400 with missing email and password', async () => {
  await request(app).post('/api/users/signin').send({}).expect(400);

  await request(app)
    .post('/api/users/signin')
    .send({ email: 'test@test.com' })
    .expect(400);

  await request(app)
    .post('/api/users/signin')
    .send({ password: 'password' })
    .expect(400);
});

// Signin Tests that will pass the validation tests
it('fails when a email does not exist that is supplied', async () => {
  await request(app)
    .post('/api/users/signin')
    .send({ email: 'test@test.com', password: 'password' })
    .expect(400);
});

it('fails when an incorrect password is supplied', async () => {
  // we can also manually create a user
  await request(app)
    .post('/api/users/signup')
    .send({ email: 'test@test.com', password: 'password' })
    .expect(201);

  await request(app)
    .post('/api/users/signin')
    .send({ email: 'test@test.com', password: 'incorrect password' })
    .expect(400);
});

it('responds with a cookie when given valid credentials', async () => {
  // we can also manually create a user
  await request(app)
    .post('/api/users/signup')
    .send({ email: 'test@test.com', password: 'password' })
    .expect(201);

  const res = await request(app)
    .post('/api/users/signin')
    .send({ email: 'test@test.com', password: 'password' })
    .expect(200);

  expect(res.get('Set-Cookie')).toBeDefined();
});
