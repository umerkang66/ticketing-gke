// Message is the raw event coming from nats server
import { Message } from 'node-nats-streaming';
import { Subjects, Listener, TicketCreatedEvent } from '@ticketing-umer/common';
import { Ticket } from '../../models/ticket';
import { queueGroupName } from './queue-group-name';

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  protected subject: Subjects.TicketCreated = Subjects.TicketCreated;
  // all the listeners on order service should have teh same queueGroupName
  protected queueGroupName: string = queueGroupName;

  protected async onMessage(
    data: TicketCreatedEvent['data'],
    msg: Message
  ): Promise<void> {
    // save the ticket data coming from ticket service to the local ticket collection
    const { title, price, id } = data;

    // Inside the build method, this "id" is converted into _id (required)
    const ticket = Ticket.build({ id, title, price });
    // VERSION: on ticket created by ticket-service, the version will always be zero, so we don't need to add in Ticket.build, because update-if-current plugin will automatically set it to "0"
    await ticket.save();

    // we have process this event successfully
    msg.ack();
  }
}
