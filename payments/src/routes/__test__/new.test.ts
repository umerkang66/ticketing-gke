import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { Payment } from '../../models/payment';
import { natsWrapper } from '../../nats-wrapper';
import { stripe } from '../../stripe';

jest.mock('../../stripe');

it("returns a 404 when purchasing an order that doesn't exist", async () => {
  const orderId = new mongoose.Types.ObjectId().toHexString();

  await request(app)
    .post('/api/payments')
    .set('Cookie', getAuthCookie())
    .send({ token: 'asdf', orderId })
    .expect(404);
});

it("returns a 401 when purchasing an order that doesn't belong to user", async () => {
  const order = await Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 10,
    status: OrderStatus.Created,
  }).save();

  // This will send request through any other user
  await request(app)
    .post('/api/payments')
    .set('Cookie', getAuthCookie())
    .send({ token: 'asdf', orderId: order.id })
    .expect(401);
});

it('returns 400 when purchasing a canceled order', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();

  const order = await Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price: 10,
    status: OrderStatus.Canceled,
  }).save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', getAuthCookie(userId))
    .send({ token: 'asdf', orderId: order.id })
    .expect(400);
});

it('returns a 201 with valid inputs', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();

  const order = await Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price: 10,
    status: OrderStatus.Created,
  }).save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', getAuthCookie(userId))
    .send({ token: 'tok_visa', orderId: order.id })
    .expect(201);

  const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];

  expect(chargeOptions.source).toBe('tok_visa');
  expect(chargeOptions.amount).toBe(order.price * 100);
  expect(chargeOptions.currency).toBe('usd');

  // is payment created?
  const payment = await Payment.findOne({
    orderId: order.id,
    // this value is coming from stripe mock library
    stripeId: 'test_id',
  });
  expect(payment).not.toBeNull();

  // is event published?
  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const eventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  expect(eventData.id).toBe(payment!.id);
  expect(eventData.orderId).toBe(order.id);
  // this is coming from stripe mock library
  expect(eventData.stripeId).toBe('test_id');
});

it.skip('returns a 201 with valid inputs with real stripe api', async () => {
  // TO RUN THIS TEST: remove the mock stripe library, and then add the environment variable in shell of stripe secret key
  const userId = new mongoose.Types.ObjectId().toHexString();

  // random generated price
  const price = Math.floor(Math.random() * 10000);

  const order = await Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price,
    status: OrderStatus.Created,
  }).save();

  const orderId = order.id;
  await request(app)
    .post('/api/payments')
    .set('Cookie', getAuthCookie(userId))
    .send({ token: 'tok_visa', orderId })
    .expect(201);

  const stripCharges = await stripe.charges.list({
    limit: 50,
  });
  const stripeCharge = stripCharges.data.find(
    charge => charge.amount === price * 100
  );

  expect(stripeCharge!).toBeDefined();
  expect(stripeCharge!.currency).toBe('usd');

  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripeCharge!.id,
  });
  expect(payment).not.toBeNull();

  // is event published?
  expect(natsWrapper.client.publish).toHaveBeenCalled();
  const eventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  expect(eventData.id).toBe(payment!.id);
  expect(eventData.orderId).toBe(order.id);
  // this is coming from stripe mock library
  expect(eventData.stripeId).toBe('test_id');
});
