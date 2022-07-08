import {
  Subjects,
  Publisher,
  OrderCanceledEvent,
} from '@ticketing-umer/common';

export class OrderCanceledPublisher extends Publisher<OrderCanceledEvent> {
  protected subject: Subjects.OrderCanceled = Subjects.OrderCanceled;
}
