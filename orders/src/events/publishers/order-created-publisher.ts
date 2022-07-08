import { Publisher, OrderCreatedEvent, Subjects } from '@ticketing-umer/common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  protected subject: Subjects.OrderCreated = Subjects.OrderCreated;
}
