import Link from 'next/link';

const LandingPage = ({ currentUser, tickets }) => {
  const ticketList = tickets.map(ticket => {
    return (
      <tr key={ticket.id}>
        <td>{ticket.title}</td>
        <td>{ticket.price}</td>
        <td>
          <Link href="/tickets/[ticketId]" as={`/tickets/${ticket.id}`}>
            <a className="btn btn-secondary">View</a>
          </Link>
        </td>
      </tr>
    );
  });

  return (
    <div>
      <h1>Tickets</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Link</th>
          </tr>
        </thead>

        <tbody>{ticketList}</tbody>
      </table>
    </div>
  );
};

// this runs both on server and browser
LandingPage.getInitialProps = async (context, client, currentUser) => {
  const { data } = await client
    .get('/api/tickets')
    .catch(err => console.log(err));

  return { tickets: data };
};

export default LandingPage;
