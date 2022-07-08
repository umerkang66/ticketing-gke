import 'bootstrap/dist/css/bootstrap.css';
import buildClient from '../api/build-client';
import Header from '../components/header';

const AppComponent = ({
  Component,
  pageProps,
  initialPageProps,
  currentUser,
}) => {
  // whenever we try to go to distinct page in next-js, next will import the component from one of the different files of pages, then next js wraps it up with its own custom component before displaying it

  return (
    <div>
      <Header currentUser={currentUser} />

      <div className="container">
        <Component
          {...pageProps}
          {...initialPageProps}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
};

// this runs both on server and browser
AppComponent.getInitialProps = async appContext => {
  // next server is running in container, so inside the container localhost:80 or k8sLoadBalancerIp:80 is nothing
  // instead of this, we have to route this request to ingress nginx

  // ctx has req, and res properties
  const client = buildClient(appContext.ctx);
  const { data } = await client.get('/api/users/currentuser').catch(err => {
    console.log(err.message);
  });

  let initialPageProps = {};
  if (appContext.Component.getInitialProps) {
    initialPageProps = await appContext.Component.getInitialProps(
      appContext.ctx,
      client,
      data.currentUser
    );
  }

  return {
    initialPageProps,
    ...data,
  };
};

export default AppComponent;
