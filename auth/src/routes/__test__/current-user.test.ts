import request from 'supertest';
import { app } from '../../app';

it('responds with details about the current user', async () => {
  // get the cookie from previous req, and set it to the next request
  const cookie = await getAuthCookie();

  const res = await request(app)
    .get('/api/users/currentuser')
    .set('Cookie', cookie)
    .send()
    .expect(200);

  expect(res.body.currentUser.email).toBe('test@test.com');
});

it('responds with null if user is not signed in', async () => {
  const res = await request(app)
    .get('/api/users/currentuser')
    .send()
    .expect(200);

  expect(res.body.currentUser).toBeNull();
});
