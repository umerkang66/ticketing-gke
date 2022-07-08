import nats from 'node-nats-streaming';
import { TicketCreatedPublisher } from './events/ticket-created-publisher';

console.clear();

// client id should be different, if we want to create multiple instances
// ticketing is the name of project name inside nats-streaming-server
const stan = nats.connect('ticketing', 'abc', {
  url: 'http://localhost:4222',
});

stan.on('connect', async () => {
  // after stan client is connected
  console.log('Publisher connected to NATS');
  const data = { id: '123', title: 'concert', price: 20 };
  const publisher = new TicketCreatedPublisher(stan);

  try {
    await publisher.publish(data);
  } catch (err) {
    console.error(err);
  }
});
