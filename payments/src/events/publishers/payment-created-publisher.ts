import {
  PaymentCreatedEvent,
  Publisher,
  Subjects,
} from '@ticketing-umer/common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  protected subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
