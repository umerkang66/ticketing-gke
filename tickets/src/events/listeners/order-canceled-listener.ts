import { Listener, OrderCanceledEvent, Subjects } from '@ticketing-umer/common';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { queueGroupName } from './queue-group-name';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCanceledListener extends Listener<OrderCanceledEvent> {
  protected subject: Subjects.OrderCanceled = Subjects.OrderCanceled;
  protected queueGroupName: string = queueGroupName;

  protected async onMessage(
    data: OrderCanceledEvent['data'],
    msg: Message
  ): Promise<void> {
    const ticket = await Ticket.findById(data.ticket.id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // make the ticket unreserved
    ticket.set({ orderId: undefined });
    await ticket.save();

    // ticket is updated, version is changed, so emit the TicketUpdatedEvent, so that ticket in order service, should be updated
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      price: ticket.price,
      title: ticket.title,
      userId: ticket.userId,
      // actually only these two below properties changed
      version: ticket.version,
      orderId: ticket.orderId,
    });

    msg.ack();
  }
}
