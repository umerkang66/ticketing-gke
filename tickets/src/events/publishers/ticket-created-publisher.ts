import {
  Publisher,
  Subjects,
  TicketCreatedEvent,
} from '@ticketing-umer/common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  protected readonly subject: Subjects.TicketCreated = Subjects.TicketCreated;
}
