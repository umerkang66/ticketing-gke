import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { body } from 'express-validator';
import {
  NotFoundError,
  requireAuth,
  validateRequest,
  OrderStatus,
  BadRequestError,
} from '@ticketing-umer/common';

import { Ticket } from '../models/ticket';
import { Order } from '../models/order';
import { natsWrapper } from '../nats-wrapper';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';

const ORDER_EXPIRATION_SECONDS = 15 * 60; // 15 min

const router = express.Router();
const ObjectId = mongoose.Types.ObjectId;

const validator = [
  body('ticketId')
    .not()
    .isEmpty()
    // return boolean
    .custom((input: string) => ObjectId.isValid(input))
    .withMessage('TicketId must be provided'),
];

const mid = [requireAuth, validator, validateRequest];

// Ticket will be in the body or request
router.post('/api/orders', ...mid, async (req: Request, res: Response) => {
  // Find the ticket the user is trying to order in the database
  const { ticketId } = req.body;
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    throw new NotFoundError("Ticket you want to order doesn't exist");
  }

  // Make sure that this ticket is not already reserved
  const ticketReserved = await ticket.isReserved();
  if (ticketReserved) {
    // order is already reserved, return early
    throw new BadRequestError('Ticket is already reserved to an order');
  }

  // Calculate an expiration date for this order
  const expiration = new Date();
  expiration.setSeconds(expiration.getSeconds() + ORDER_EXPIRATION_SECONDS);

  // Build the order and save it to the database
  const order = Order.build({
    userId: req.currentUser!.id,
    status: OrderStatus.Created,
    expiresAt: expiration,
    // this will not add the ticket, but it will add the ref to ticket doc (ticket.id)
    ticket,
  });
  await order.save();

  // Publish an event that order was created
  new OrderCreatedPublisher(natsWrapper.client).publish({
    id: order.id,
    status: order.status,
    userId: order.userId,
    version: order.version,
    // this will automatically be turned into JSON before sending request, if stringify function will be called on Date obj, that will convert it into string, using the current time zone, so convert the date here in code
    expiresAt: order.expiresAt.toISOString(),
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
  });

  res.status(201).send(order);
});

export { router as newOrderRouter };
