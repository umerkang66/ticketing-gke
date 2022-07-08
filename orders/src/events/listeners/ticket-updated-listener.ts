import { Message } from 'node-nats-streaming';
import { Subjects, Listener, TicketUpdatedEvent } from '@ticketing-umer/common';
import { Ticket } from '../../models/ticket';
import { queueGroupName } from './queue-group-name';

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  protected subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
  protected queueGroupName: string = queueGroupName;

  protected async onMessage(
    data: TicketUpdatedEvent['data'],
    msg: Message
  ): Promise<void> {
    const ticket = await Ticket.findByEvent({
      id: data.id,
      version: data.version,
    });
    if (!ticket) {
      // After throwing the error, we didn't call the msg.ack(), then after 5 seconds, nats-server will send these events again
      throw new Error('Ticket not found');
    }

    // we are not just incrementing version, but set to version that came from event
    const { title, price, orderId } = data;
    ticket.set({ title, price, orderId });
    // after saving, the previous version that came from event, will be incremented and become equal to version that came from event
    // if the version of current ticket is not less than data.version (less than 1 than updated ticket), ticket will not be saved, so don't add version manually
    await ticket.save();
    msg.ack();
  }
}
