import {
  Subjects,
  Publisher,
  OrderCompleteEvent,
} from '@ticketing-umer/common';

export class OrderCompletedPublisher extends Publisher<OrderCompleteEvent> {
  protected subject: Subjects.OrderComplete = Subjects.OrderComplete;
}
