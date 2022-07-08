import {
  Publisher,
  ExpirationCompleteEvent,
  Subjects,
} from '@ticketing-umer/common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  protected subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
