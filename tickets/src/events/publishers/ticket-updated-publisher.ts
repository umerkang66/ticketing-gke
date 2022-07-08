import {
  Publisher,
  Subjects,
  TicketUpdatedEvent,
} from '@ticketing-umer/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  protected readonly subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}
