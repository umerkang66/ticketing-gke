import { randomBytes } from 'crypto';
import nats from 'node-nats-streaming';
import { TicketCreatedListener } from './events/ticket-created-listener';

console.clear();

const clientId = randomBytes(4).toString('hex');
const stan = nats.connect('ticketing', clientId, {
  url: 'http://localhost:4222',
});

stan.on('connect', () => {
  console.log('Listener connected to nats');
  new TicketCreatedListener(stan).listen();

  stan.on('close', () => {
    // anytime connection is closed, stop the node process, otherwise nats s. server will wait for 30 seconds, if this is again start up (same instance, that will never happen), after 2 request failed, stan will not send request to this server, but we want that stan don't sent the request if the connection is closed first time
    console.log('NATS connection close');
    process.exit();
  });
});

// These will close the stan, then above event handler of stan, will close the node process, these signals are added, when node ties to restart the program or stop the program (ctrl+C)

// interrupt signals
process.on('SIGINT', () => stan.close());
// terminate signals
process.on('SIGTERM', () => stan.close());
