import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  requireAuth,
  validateRequest,
  BadRequestError,
  NotFoundError,
  NotAuthorizedError,
} from '@ticketing-umer/common';
import { Order, OrderStatus } from '../models/order';
import { Payment } from '../models/payment';
import { stripe } from '../stripe';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post(
  '/api/payments',
  requireAuth,
  [
    body('token')
      .not()
      .isEmpty()
      .withMessage('Token sent by stripe should be provided'),
    body('orderId')
      .not()
      .isEmpty()
      .withMessage('Order Id token should be provided'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { token, orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) throw new NotFoundError('Order is not found');
    if (order.userId !== req.currentUser!.id) throw new NotAuthorizedError();
    if (order.status === OrderStatus.Canceled)
      throw new BadRequestError('Order is already canceled');
    if (order.status === OrderStatus.Complete)
      throw new BadRequestError('Order is already complete');

    // create charge, and amount is always defined at backend
    const charge = await stripe.charges.create({
      currency: 'usd',
      amount: order.price * 100,
      // from where this money should come from
      source: token,
    });

    const payment = Payment.build({
      orderId,
      // we currently are not using stripeId anywhere
      stripeId: charge.id,
    });
    await payment.save();

    // we haven't written test about this
    new PaymentCreatedPublisher(natsWrapper.client).publish({
      id: payment.id,
      orderId: payment.orderId,
      stripeId: payment.stripeId,
    });

    res.status(201).send({ id: payment.id });
  }
);

export { router as createChargeRouter };
