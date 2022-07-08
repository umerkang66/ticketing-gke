import { useEffect, useState } from 'react';
import Router from 'next/router';
import StripeCheckout from 'react-stripe-checkout';
import useRequest from '../../hooks/use-request';

const OrderShow = ({ order, currentUser }) => {
  if (!order) {
    return <h3>Order doesn't found</h3>;
  }

  const [timeLeft, setTimeLeft] = useState(0);
  const { doRequest, errors } = useRequest({
    url: '/api/payments',
    method: 'post',
    body: { orderId: order.id },
    onSuccess: () => Router.push('/orders'),
  });

  useEffect(() => {
    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt) - new Date();
      setTimeLeft(Math.round(msLeft / 1000));
    };

    // interval first time runs after 1000, if we want to show the time immediately we have to call this outside of setInterval
    findTimeLeft();
    const timerId = setInterval(findTimeLeft, 1000);

    return () => clearInterval(timerId);
  }, [order]);

  if (timeLeft < 0) {
    return <div>Order Expired</div>;
  }

  return (
    <div>
      <div>Time left to pay: {timeLeft} seconds</div>
      <div>{errors}</div>
      <StripeCheckout
        token={({ id }) => doRequest({ token: id })}
        stripeKey="pk_test_51LIZXQKwal9gUIqn1AYzVhFnEtQLurAOdy6KEzSYsnFopKaiHbfhsuD7E97OvEAT2MZ569XNQCFmlwRtWL070h6I00zkKfTIUO"
        // add the amount so we get back token that is also authorized to price, so if at the backend, we specify different price, it returns an error
        amount={order.ticket * 100}
        email={currentUser.email}
      />
    </div>
  );
};

OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query;
  const { data } = await client
    .get(`/api/orders/${orderId}`)
    .catch(err => console.log(err));

  return { order: data };
};

export default OrderShow;
