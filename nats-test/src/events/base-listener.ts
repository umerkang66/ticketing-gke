import type { Message, Stan, SubscriptionOptions } from 'node-nats-streaming';
import { Subjects } from './subjects';

interface Event {
  subject: Subjects;
  data: any;
}

export abstract class Listener<T extends Event> {
  protected abstract readonly subject: T['subject'];
  protected abstract queueGroupName: string;
  protected abstract onMessage(data: T['data'], msg: Message): void;
  protected ackWait = 5 * 1000;

  constructor(private client: Stan) {}

  private subscriptionOptions(): SubscriptionOptions {
    // when we create a subscription name, nats internally is going to create a record of subscription, and it will see if the events previously has been sent and acknowledged by this service

    // if event fail by listener, we have to reprocess it, it should be added on the listener

    // DURABLE_NAME option requires if queue group is created in the "nats s. server".
    // queue-group creates reference of this listener on the "nats s. server"
    return this.client
      .subscriptionOptions()
      .setDeliverAllAvailable()
      .setManualAckMode(true)
      .setAckWait(this.ackWait)
      .setDurableName(this.queueGroupName);
  }

  private parseMessage(msg: Message): T['data'] {
    const data = msg.getData();
    // it can be string or buffer
    return typeof data === 'string'
      ? JSON.parse(data)
      : JSON.parse(data.toString('utf-8'));
  }

  public listen(): void {
    // subscribe to ticket:created channel
    // also use queue group, to not dump the service in nats, if the service is stopped
    const subscription = this.client.subscribe(
      this.subject,
      this.queueGroupName,
      this.subscriptionOptions()
    );

    subscription.on('message', (msg: Message) => {
      console.log(`Message received: ${this.subject} / ${this.queueGroupName}`);

      const parsedData = this.parseMessage(msg);
      this.onMessage(parsedData, msg);
    });
  }
}
