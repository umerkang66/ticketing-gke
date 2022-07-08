import { Ticket } from '../ticket';

it('implements optimistic concurrency control', async () => {
  // Create an instance of ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 5,
    userId: '123',
  });

  // Save the ticket to db
  await ticket.save();

  // fetch the ticket twice
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id);

  // make two separate changes to the tickets we fetched
  firstInstance!.set({ price: 10 });
  secondInstance!.set({ price: 15 });

  // save the first fetched ticket

  await firstInstance!.save();

  // save the second fetched ticket, (this thing should have outdated version number), and expect an error
  try {
    await secondInstance!.save();
  } catch (err) {
    return;
  }

  throw new Error('Should not reach this point');
});

it('increments the version number on multiple saves', async () => {
  const ticket = Ticket.build({
    title: 'ticket',
    price: 20,
    userId: '123',
  });

  await ticket.save();
  expect(ticket.version).toBe(0);
  await ticket.save();
  expect(ticket.version).toBe(1);
  await ticket.save();
  expect(ticket.version).toBe(2);
});
