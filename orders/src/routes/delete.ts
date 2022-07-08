import express, { Request, Response } from 'express';
import { Order, OrderStatus } from '../models/order';
import {
  requireAuth,
  NotFoundError,
  NotAuthorizedError,
} from '@ticketing-umer/common';
import { OrderCanceledPublisher } from '../events/publishers/order-canceled-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.delete(
  '/api/orders/:orderId',
  requireAuth,
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('ticket');

    if (!order) {
      throw new NotFoundError("Requested Order doesn't found");
    }
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    order.set({ status: OrderStatus.Canceled });
    await order.save();

    // Publishing an event saying this was cancelled
    new OrderCanceledPublisher(natsWrapper.client).publish({
      // Only these properties are required for cancel event to other services
      id: order.id,
      version: order.version,
      ticket: { id: order.ticket.id },
    });

    res.status(204).send(order);
  }
);

export { router as deleteOrderRouter };
