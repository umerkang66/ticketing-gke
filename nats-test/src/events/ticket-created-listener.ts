import type { Message } from 'node-nats-streaming';
import { Listener } from './base-listener';
import { Subjects } from './subjects';
import { TicketCreatedEvent } from './ticket-created-event';

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  protected readonly subject: Subjects.TicketCreated = Subjects.TicketCreated;
  protected queueGroupName = 'tickets-service';

  protected onMessage(data: TicketCreatedEvent['data'], msg: Message): void {
    console.log('Event data!', data);
    // tell the event, that it is perfectly acknowledged, so don't them again and again
    msg.ack();
  }
}
